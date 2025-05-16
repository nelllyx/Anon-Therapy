const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const auth = require('../services/authenticationService')
const Users = require("../model/userSchema")
const AppError = require("../exceptions/AppErrors");
const transport = require('../config/nodeMailer')
const Plans = require('../model/userPlans')
const userRoles = require("../config/userRoles");
const Payment = require('../model/paymentSchema')
const Bookings = require('../model/userBooking')


exports.signUp = catchAsync(
    async (req,res) => {
        const {username, email, password, gender, role = userRoles.CLIENT} = req.body
        const isUsername = await Users.findOne({username})
        const isEmail = await Users.findOne({email})
        if(isUsername) throw new AppError("Username already exist", 400)
        if(isEmail) throw new AppError("Email already exist", 400)
        if (!Object.values(userRoles).includes(role))throw new AppError("Invalid role", 404)

        const newUser = await User.createUser({username, email, password, gender,role})

      await auth.generateUserOtp(newUser)

       await transport.sendMail(auth.sendOtpToUserEmail(email, newUser.otp ,username),(err, info) =>{

            if(err){
                return console.error('Error occurred while sending email:', err)
            }
            console.log('Email sent successfully:', info.response)
        })


    res.status(201).json({
        message: 'User registered successfully',
        data: {
            user: newUser
        }
    })

})

exports.login = catchAsync(
    async (req,res) =>{

        const {email, password} = req.body
        const user = await Users.findOne({email})
        const token = auth.signUpToken(user._id, user.role)

        user.otpCreationTime = Date.now()

        await user.save()


        if(!email || !password){
            throw new AppError("Email and password required", 400)
        }
        if(!user || !(await user.correctPassword(password)) ){
            throw new AppError("Invalid Email or Password", 401)
        }

        if(user.isVerified === false){
            throw new AppError("Please complete your email verification", 400)
        }

        res.status(200).json({
            user,
            status: 'success',
            token
        })
    })


exports.createBookings = catchAsync(
    async (req,res)=>{

        console.log('Request body:', req.body);

        const { planName, selectedTherapy} = req.body

    const normalizedTherapy =  selectedTherapy.toLowerCase()
        console.log(normalizedTherapy)
        const userId = req.user.id
        const plan = await Plans.findOne({name: planName})
        if(!plan)throw new AppError('Plan not found')
        const validateBooking = await Bookings.findOne({userId, isBookingActive: true}).exec()
        if(validateBooking)throw new AppError('You already have an active booking. Please complete or cancel it before making a new booking.')

        const newBooking = await User.createBooking({userId,  plan: plan._id , selectedTherapy: normalizedTherapy})
        res.status(201).json({
            message: 'Booking created successfully',
            data: {
                plan: plan.name,
                price: plan.price,
                features: plan.features,
                selectedTherapy: newBooking.selectedTherapy,
                id: newBooking._id
            }
        })
    }
)

exports.initializePayment = catchAsync(
    async (req,res)=>{
        console.log('Request body:', req.body);
        const userId = req.user.id
        const {email, amount, bookingId} = req.body

        const response = await fetch ('https://api.paystack.co/transaction/initialize',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            },
            body: JSON.stringify({
                email,
                amount: amount * 100
            })
        })

        if(!response.ok){
            const error = await response.text()
            throw new AppError(`PayStack API error: ${error}`)
        }

        await Payment.create({email, amount, bookingId, userId})
        const data = await response.json()

        res.status(200).json({
            success: true,
            message: 'Payment initialized successfully',
            data: data.data
        })
    }
)

exports.confirmPayment = catchAsync(
    async (req,res)=>{
        const paymentReference = req.params.reference
        const userId = req.user.id
        console.log(userId)
        const response = await fetch (`https://api.paystack.co/transaction/verify/${paymentReference}`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            },
        })
        const data = await response.json()
        if(response.status === 200){
            const transactionStatus = data.data.status;
            if(transactionStatus === 'success'){
                const payment = await Payment.findOne({userId}).exec()
                payment.status = 'successful'
                await payment.save()
                const booking = await Bookings.findOne({userId})
                booking.status = 'confirmed'
                booking.isBookingActive = true
                await booking.save()
            }else if(transactionStatus === 'failed'){
                const payment = await Payment.findById(userId)
                payment.status = 'failed'
                payment.save()
            }

            res.status(200).json({
                apiStatus: data.status,
                transactionStatus: transactionStatus
            });
        }else{
            res.status(response.status).json({
                message: 'Failed to verify payment',
                apiStatus: data.status
            });
        }
    }
)



