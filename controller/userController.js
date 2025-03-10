const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const auth = require('../services/authenticationService')
const Users = require("../model/userSchema")
const AppError = require("../exceptions/AppErrors");
const transport = require('../config/nodeMailer')

exports.signUp = catchAsync(
    async (req,res) => {
        const {username, email, password, gender} = req.body
        const isUsername = await Users.findOne({username})
        const isEmail = await Users.findOne({email})
        if(isUsername) throw new AppError("Username already exist", 400)
        if(isEmail) throw new AppError("Email already exist", 400)

    const newUser = await User.createUser({username, email, password, gender})

      await auth.generateUserOtp(newUser)

       await transport.sendMail(auth.sendOtpToUserEmail(email, newUser.otp ,username),(err, info) =>{

            if(err){
                return console.error('Error occurred while sending email:', err)
            }
            console.log('Email sent successfully:', info.response)
        })


    res.status(201).json({
        status: 'success',
        data: {
            user: newUser,
        }
    })

})

exports.vetifyOtp = catchAsync(async (req, res)=>{
    const {id, otp } = req.body
    const token  = await auth.otpVerification(otp, Users, id)

    res.status(200).json({
        token
    })
})



exports.login = catchAsync(
    async (req,res) =>{

        const {email, password} = req.body
        const user = await Users.findOne({email})
        const token = auth.signUpToken(user._id)


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
            status: 'success',
            token
        })
    })


exports.createBookings = catchAsync(

    async (req,res)=>{
        const newBooking = await User.createBooking(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                booking: newBooking
            }
        })
    }
)




