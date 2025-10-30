const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const {generateUserOtp, sendOtpToUserEmail, validateSelectedDay, generateSessionDates,
    assignTherapistToClient, calculateSubscriptionEndDate} = require('../services/authenticationService')
const Users = require("../model/userSchema")
const AppError = require("../exceptions/AppErrors");
const {transporter} = require('../config/nodeMailer')
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

     // const info =  await transport.sendMail(sendOtpToUserEmail(email, newUser.otp ,username),(err, info) =>{
     //
     //        if(err){
     //            return console.error('Error occurred while sending email:', err)
     //        }
     //        console.log('Email sent successfully:', info.response)
     //    })

        const info =  await transporter.sendMail(sendOtpToUserEmail(email, newUser.otp ,username))

        console.log('Email sent successfully:', info.response);


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

const NotificationService = require('../services/notificationService')

exports.confirmPayment = catchAsync(
    async (req,res)=>{
        const paymentReference = req.params.reference
        const userId = req.user.id
        const io = req.app.get('io')
        const notifier = new NotificationService(io)
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

                // Notify user (persist + live if online)
                await notifier.notifyPayment(userId, {
                    message: 'Your payment was successful',
                    amount: payment.amount,
                    status: 'successful',
                    transactionId: data.data.reference || paymentReference
                })
            } else if (transactionStatus === 'failed') {
                const payment = await Payment.findOne({ userId }).exec();
                payment.status = 'failed';
                await payment.save();

                await notifier.notifyPayment(userId, {
                    message: 'Your payment failed',
                    amount: payment.amount,
                    status: 'failed',
                    transactionId: data.data.reference || paymentReference
                })
            }else if(transactionStatus === 'abandoned'){
                const payment = await Payment.findOne({userId}).exec()
                payment.status = 'abandoned'
                await payment.save()

                await notifier.notifyPayment(userId, {
                    message: 'Your payment was abandoned',
                    amount: payment.amount,
                    status: 'abandoned',
                    transactionId: data.data.reference || paymentReference
                })
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

        const {planName, therapyType, sessionDays, preferredTime} = req.body

        const plan = await Plans.findOne({name: planName})

        if(!plan)throw new AppError('Plan not found', 404)

        const planId = plan._id

        validateSelectedDay(planName,sessionDays)

      const sessionPreference =  await SessionPreference.create({userId , subscriptionId, planId, therapyType: therapyType.toLowerCase(), sessionDays, preferredTime});

        const selectedTherapist =  await assignTherapistToClient(userId, subscriptionId, planName, Subscription.status, therapyType)

        if (!selectedTherapist) throw new AppError('No therapist available', 404);

        const sessionDates = generateSessionDates(sessionDays,planName)

        const sessions = await Promise.all(
            sessionDates.map(async (date) => {
                return await Session.create({
                    userId,
                    therapistId: selectedTherapist._id,
                    date,
                    preferredTime: sessionPreference.preferredTime,
                    startTime: null,
                    endTime: null,
                    subscriptionId,
                    therapyType,
                    status: 'upcoming',
                });
            })
        );


        // Update therapist's client list
        await Therapist.findByIdAndUpdate(selectedTherapist._id, {$inc: { currentClients: 1 }
        });

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

exports.checkActiveSubscription = catchAsync(async (req,res,next) =>{

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

exports.getUpcomingSessions = catchAsync(async (req,res,next) => {

    const userId = req.user.id

    const currentDate = Date.now()

    const Sessions = await Session.find({userId: userId, date: {$gt: currentDate} })
    .sort({ date: 1 })
    .limit(4)
    .populate({path: 'therapistId',
        select: 'firstName lastName profile.avatar',
    model: 'Therapist'
    });

    if(!Sessions || Sessions.length < 0)throw new AppError('No upcoming sessions for this user', 404)



    res.status(200).json({
        data: {
            Sessions
        }
    })


})

exports.getDashboard = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const currentDate = new Date();

    // Get user profile information
    const user = await Users.findById(userId).select('-password -otp');
    
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // // Get active subscription with plan details
    // const activeSubscription = await Subscriptions.findOne({
    //     userId: userId,
    //     isSubscriptionActive: true
    // }).populate({
    //     path: 'planId',
    //     select: 'name price features'
    // });
    //
    // // Get upcoming sessions (next 4)
    // const upcomingSessions = await Session.find({
    //     userId: userId,
    //     date: { $gt: currentDate }
    // })
    // .sort({ date: 1 })
    // .limit(4)
    // .populate({
    //     path: 'therapistId',
    //     select: 'firstName lastName profile.avatar specialization'
    // });
    //
    // // Get completed sessions count
    // const completedSessionsCount = await Session.countDocuments({
    //     userId: userId,
    //     status: 'completed'
    // });
    //
    // // Get total sessions count for current subscription
    // const totalSessionsCount = await Session.countDocuments({
    //     userId: userId,
    //     subscriptionId: activeSubscription?._id
    // });
    //
    // // Get recent payment history (last 3)
    // const recentPayments = await Payment.find({ userId: userId })
    //     .sort({ dateOfPayment: -1 })
    //     .limit(3)
    //     .select('amount status dateOfPayment');
    //
    // // Calculate subscription progress
    // let subscriptionProgress = null;
    // if (activeSubscription) {
    //     const usedSessions = totalSessionsCount;
    //     const maxSessions = activeSubscription.maxSession;
    //     subscriptionProgress = {
    //         used: usedSessions,
    //         total: maxSessions,
    //         remaining: maxSessions - usedSessions,
    //         percentage: Math.round((usedSessions / maxSessions) * 100)
    //     };
    // }

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                gender: user.gender,
             },
            // subscription: activeSubscription ? {
            //     id: activeSubscription._id,
            //     plan: activeSubscription.planId,
            //     status: activeSubscription.status,
            //     startDate: activeSubscription.startDate,
            //     endDate: activeSubscription.endDate,
            //     sessionsPerWeek: activeSubscription.sessionsPerWeek,
            //     progress: subscriptionProgress
            // } : null,
    //         upcomingSessions: upcomingSessions.map(session => ({
    //             id: session._id,
    //             date: session.date,
    //             startTime: session.startTime,
    //             duration: session.duration,
    //             therapyType: session.therapyType,
    //             status: session.status,
    //             therapist: session.therapistId
    //         })),
    //         statistics: {
    //             completedSessions: completedSessionsCount,
    //             totalSessions: totalSessionsCount,
    //             upcomingSessions: upcomingSessions.length
    //         },
    //         recentPayments: recentPayments,
    //         sessionPreference: sessionPreference ? {
    //             therapyType: sessionPreference.therapyType,
    //             selectedDay: sessionPreference.selectedDay,
    //             preferredTime: sessionPreference.preferredTime
    //         } : null
         }
    });
});