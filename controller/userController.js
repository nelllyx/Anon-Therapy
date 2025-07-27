const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const {generateUserOtp, sendOtpToUserEmail, validateSelectedDay, generateSessionDates,
    assignTherapistToClient, calculateSubscriptionEndDate} = require('../services/authenticationService')
const Users = require("../model/userSchema")
const AppError = require("../exceptions/AppErrors");
const transport = require('../config/nodeMailer')
const Plans = require('../model/userPlans')
const userRoles = require("../config/userRoles");
const Payment = require('../model/paymentSchema')
const Subscriptions = require('../model/Subscriptions')
const SessionPreference = require('../model/sessionPreferenceSchema')
const Session = require("../model/sessionSchema");
const Therapist = require("../model/therapistSchema");


exports.signUp = catchAsync(
    async (req,res) => {
        const {username, email, password, gender, role = userRoles.CLIENT} = req.body
        const isUsername = await Users.findOne({username})
        const isEmail = await Users.findOne({email})
        if(isUsername) throw new AppError("Username already exist", 400)
        if(isEmail) throw new AppError("Email already exist", 400)
        if (!Object.values(userRoles).includes(role))throw new AppError("Invalid role", 400)

        const newUser = await User.createUser({username, email, password, gender,role})

      await generateUserOtp(newUser)

       await transport.sendMail(sendOtpToUserEmail(email, newUser.otp ,username),(err, info) =>{

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


exports.createSubscriptions = catchAsync(

    async (req,res)=>{

        const { planName} = req.body

   // const normalizedTherapy =  selectedTherapy.toLowerCase()

        const userId = req.user.id

        const plan = await Plans.findOne({name: planName})

        if(!plan)throw new AppError('Plan not found')

        const sessionsPerWeek = plan.sessionsPerWeek

        const maxSession = sessionsPerWeek * 4

        const endDate = calculateSubscriptionEndDate()

        const validateSubscription = await Subscriptions.findOne({userId, isSubscriptionActive: true}).exec()

        if(validateSubscription)throw new AppError('You already have an active subscription. Please complete or cancel it before making a new subscription.')

        const newSubscription = await User.createSubscription({userId,  planId: plan._id, maxSession: maxSession, sessionsPerWeek, endDate})


        if(planName === 'Basic'){

            newSubscription.status = 'subscribed'
            newSubscription.isSubscriptionActive = true
            newSubscription.endDate = endDate
            await newSubscription.save()

        }


        res.status(201).json({
            message: 'Subscription created successfully',
            data: {
                plan: plan.name,
                price: plan.price,
                features: plan.features,
               // selectedTherapy: newBooking.selectedTherapy,
                id: newSubscription._id
            }
        })
    }
)


exports.initializePayment = catchAsync(
    async (req,res)=> {
        const userId = req.user.id
        const {email, amount, subscriptionId} = req.body

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

        await Payment.create({email, amount, subscriptionId, userId})
        const data = await response.json()
        console.log(data)
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
            if (transactionStatus === 'success') {
                const payment = await Payment.findOne({ userId }).exec();
                payment.status = 'successful';
                await payment.save();
                const subscription = await Subscriptions.findOne({ userId }).exec();
                subscription.status = 'subscribed';
                subscription.isSubscriptionActive = true;
                await subscription.save();
            } else if (transactionStatus === 'failed') {
                const payment = await Payment.findById(userId).exec();
                payment.status = 'failed';
                await payment.save();
            }else if(transactionStatus === 'abandoned'){
                const payment = await Payment.findOne({userId}).exec()
                payment.status = 'abandoned'
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



exports.createBooking = catchAsync(

    async (req, res, next) => {

        const userId = req.user.id

        const Subscription = await Subscriptions.findOne({userId: userId, isSubscriptionActive: true})

        const subscriptionId = Subscription._id

        const existingSession = await SessionPreference.findOne({userId: userId, isSubscriptionActive: true})

        if(existingSession)throw new AppError('You already have an existing session preference', 400)

        const {planName, therapyType, selectedDay, preferredTime} = req.body

        const plan = await Plans.findOne({name: planName})

        if(!plan)throw new AppError('Plan not found', 404)

        const planId = plan._id

        validateSelectedDay(planName,selectedDay)

        console.log(therapyType)

        await SessionPreference.create({userId , subscriptionId, planId, therapyType: therapyType.toLowerCase(), selectedDay, preferredTime});

        const selectedTherapist =  await assignTherapistToClient(userId, subscriptionId, planName, Subscription.status, therapyType)

        if (!selectedTherapist) throw new AppError('No therapist available', 404);

        const sessionDates = generateSessionDates(selectedDay,planName)

        console.log("Generated sessionDates:", sessionDates);

        const sessions = await Promise.all(
            sessionDates.map(async (date) => {
                return await Session.create({
                    userId,
                    therapistId: selectedTherapist._id,
                    date,
                    startTime: null,
                    endTime: null,
                    subscriptionId,
                    therapyType,
                    status: 'scheduled',
                });
            })
        );


        // Update therapist's client list
        await Therapist.findByIdAndUpdate(selectedTherapist._id, {$inc: { currentClients: 1 }
        });

       // await session.save();

        res.status(200).json({
            success: true,
            sessions
        })

    })


exports.checkPaymentHistory = catchAsync(

    async (req,res,next) => {
        const userId = req.user.id
        const User = await Users.findById(userId)

        if(User){
            const payments = await Payment.find({userId:userId})

            if (payments.length === 0) {
                return res.status(200).json({ message: 'No payment history found.' });
            }

            const paymentData = payments.map(payment => ({
                email: User.email, // user email, since you fetched user
                amount: payment.amount,
                status: payment.status,
                date: payment.dateOfPayment,
            }));

            res.status(200).json({
                data: paymentData


            })
        }else throw new AppError('User Not Found', 404)

    }
)

exports.checkActiveSubscription = catchAsync(

    async (req,res,next) =>{
        const userId = req.user.id

        const subscription = await Subscriptions.findOne({userId})
            .populate({ path: 'planId', select: 'name' })
            .exec();
        if(!subscription)throw new AppError('Subscription not found for this user', 404)

        if(subscription.isSubscriptionActive === true) {

            res.status(200).json({
             status: 'success',
            data:{
                subscription,
                planName: subscription.planId.name

            }

            })
        }

    }
)

