const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const { generateUserOtp, sendOtpToUserEmail, validateSelectedDay, generateSessionDates,
    assignTherapistToClient, calculateSubscriptionEndDate } = require('../services/authenticationService')
const Users = require("../model/userSchema")
const AppError = require("../exceptions/AppErrors");
const { transporter } = require('../config/nodeMailer')
const Plans = require('../model/userPlans')
const userRoles = require("../config/userRoles");
const Payment = require('../model/paymentSchema')
const Subscriptions = require('../model/Subscriptions')
const SessionPreference = require('../model/sessionPreferenceSchema')
const Session = require("../model/sessionSchema");
const Therapist = require("../model/therapistSchema");
const NotificationService = require('../services/notificationService')
const mongoose = require('mongoose');
const validationService = require('../services/validationService');


exports.signUp = catchAsync(
    async (req, res, next) => {
        validationService.validateSignUp(req.body);
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { username, email, password, gender, role = userRoles.CLIENT } = req.body
            const isUsername = await Users.findOne({ username }).session(session)
            const isEmail = await Users.findOne({ email }).session(session)
            if (isUsername) throw new AppError("Username already exist", 400)
            if (isEmail) throw new AppError("Email already exist", 400)
            if (!Object.values(userRoles).includes(role)) throw new AppError("Invalid role", 400)

            const newUser = await User.createUser({ username, email, password, gender, role }, session)

            await generateUserOtp(newUser, session)

            const info = await transporter.sendMail(sendOtpToUserEmail(email, newUser.otp, username))

            console.log('Email sent successfully:', info.response);

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: 'User registered successfully',
                data: {
                    user: newUser
                }
            })
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    })


exports.createSubscriptions = catchAsync(

    async (req, res, next) => {
        validationService.validateCreateSubscription(req.body);
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { planName } = req.body

            const userId = req.user.id

            const plan = await Plans.findOne({ name: planName }).session(session)

            if (!plan) throw new AppError('Plan not found')

            const sessionsPerWeek = plan.sessionsPerWeek

            const maxSession = sessionsPerWeek * 4

            const validateSubscription = await Subscriptions.findOne({ userId, isSubscriptionActive: true }).session(session).exec()

            if (validateSubscription) throw new AppError('You already have an active subscription. Please complete or cancel it before making a new subscription.')

            const newSubscription = await User.createSubscription({ userId, planId: plan._id, maxSession: maxSession, sessionsPerWeek }, session)


            if (planName === 'Basic') {

                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1);

                newSubscription.status = 'subscribed'
                newSubscription.isSubscriptionActive = true
                newSubscription.endDate = endDate
                await newSubscription.save({ session: session })

            }

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: 'Subscription created successfully',
                data: {
                    plan: plan.name,
                    price: plan.price,
                    features: plan.features,
                    id: newSubscription._id
                }
            })
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
)


exports.initializePayment = catchAsync(
    async (req, res) => {
        validationService.validateInitializePayment(req.body);
        const userId = req.user.id
        const { email, amount, subscriptionId } = req.body

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
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

        if (!response.ok) {
            const error = await response.text()
            throw new AppError(`PayStack API error: ${error}`)
        }

        await Payment.create({ email, amount, subscriptionId, userId })
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
    async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const paymentReference = req.params.reference
            const userId = req.user.id
            const io = req.app.get('io')
            const notifier = new NotificationService(io)
            const response = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                },
            })
            const data = await response.json()
            if (response.status === 200) {
                const transactionStatus = data.data.status;
                if (transactionStatus === 'success') {
                    const payment = await Payment.findOne({ userId }).session(session).exec();
                    payment.status = 'successful';
                    await payment.save({ session: session });
                    const subscription = await Subscriptions.findOne({ userId }).session(session).exec();
                    subscription.status = 'subscribed';
                    subscription.isSubscriptionActive = true;
                    await subscription.save({ session: session });

                    // Notify user (persist + live if online)
                    await notifier.notifyPaymentStatus(userId, {
                        message: `Payment of #${payment.amount} was successful`,
                        amount: payment.amount,
                        status: 'successful',
                        transactionId: data.data.reference || paymentReference
                    })
                } else if (transactionStatus === 'failed') {
                    const payment = await Payment.findOne({ userId }).session(session).exec();
                    payment.status = 'failed';
                    await payment.save({ session: session });

                    await notifier.notifyPaymentStatus(userId, {
                        message: 'Your payment failed',
                        amount: payment.amount,
                        status: 'failed',
                        transactionId: data.data.reference || paymentReference
                    })
                } else if (transactionStatus === 'abandoned') {
                    const payment = await Payment.findOne({ userId }).session(session).exec()
                    payment.status = 'abandoned'
                    await payment.save({ session: session })

                    await notifier.notifyPaymentStatus(userId, {
                        message: 'Your payment was abandoned',
                        amount: payment.amount,
                        status: 'abandoned',
                        transactionId: data.data.reference || paymentReference
                    })
                }

                await session.commitTransaction();
                session.endSession();

                res.status(200).json({
                    apiStatus: data.status,
                    transactionStatus: transactionStatus
                });
            } else {
                await session.abortTransaction();
                session.endSession();
                res.status(response.status).json({
                    message: 'Failed to verify payment',
                    apiStatus: data.status
                });
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
)



exports.createBooking = catchAsync(

    async (req, res, next) => {
        validationService.validateCreateBooking(req.body);
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const userId = req.user.id

            const [Subscription, existingSession] = await Promise.all([
                Subscriptions.findOne({ userId, isSubscriptionActive: true }).session(session),
                SessionPreference.findOne({ userId, isSubscriptionActive: true }).session(session),
            ]);

            if (!Subscription) throw new AppError('No active subscription found', 404);

            if (existingSession) throw new AppError('You already have an existing session preference', 400)

            const subscriptionId = Subscription._id

            const { planName, therapyType, sessionDays, preferredTime } = req.body

            const plan = await Plans.findOne({ name: planName }).session(session)

            if (!plan) throw new AppError('Plan not found', 404)

            const planId = plan._id

            validateSelectedDay(planName, sessionDays)

            const sessionPreference = await SessionPreference.create([{ userId, subscriptionId, planId, therapyType: therapyType.toLowerCase(), sessionDays, preferredTime }], { session: session }).then(doc => doc[0]);

            const selectedTherapist = await assignTherapistToClient(userId, subscriptionId, planName, Subscription.status, therapyType)

            if (!selectedTherapist) throw new AppError('No therapist available', 404);

            const therapistId = selectedTherapist._id

            const sessionDates = generateSessionDates(sessionDays, planName)

            if (!Subscription.endDate) {

                Subscription.endDate = calculateSubscriptionEndDate(sessionDates[0])

                await Subscription.save({ session: session })

            }


            const io = req.app.get('io')
            const notifier = new NotificationService(io)

            await notifier.notifyNewTherapistAssignment(userId, {
                message: `A therapist has been assigned to handle your sessions DR. ${selectedTherapist.firstName}`,
                therapistFirstName: selectedTherapist.firstName,
                therapistLastName: selectedTherapist.lastName,
                therapistBio: selectedTherapist.profile.bio,
            })


            await notifier.notifyNewSessionBooking(therapistId.toString(), {
                message: `A client has been assigned to you for the month. ${selectedTherapist.firstName}`,
            })

            const sessions = await Promise.all(
                sessionDates.map(async (date) => {
                    return await Session.create([{
                        userId,
                        therapistId,
                        date,
                        preferredTime: sessionPreference.preferredTime,
                        startTime: null,
                        endTime: null,
                        subscriptionId,
                        therapyType,
                        status: 'upcoming',
                    }], { session: session }).then(doc => doc[0]);
                })
            );


            // Update therapist's client list
            await Therapist.findByIdAndUpdate(selectedTherapist._id, {
                $inc: { currentClients: 1 }
            }, { session: session });

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                success: true,
                sessions
            })
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    })


exports.checkPaymentHistory = catchAsync(async (req, res, next) => {
    const userId = req.user.id
    const User = await Users.findById(userId)

    if (User) {
        const payments = await Payment.find({ userId: userId })

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
    } else throw new AppError('User Not Found', 404)

}
)

exports.checkActiveSubscription = catchAsync(async (req, res, next) => {

    const userId = req.user.id

    const subscription = await Subscriptions.findOne({ userId })
        .populate({ path: 'planId', select: 'name' })
        .exec();
    if (!subscription) throw new AppError('Subscription not found for this user', 404)

    if (subscription.isSubscriptionActive === true) {

        res.status(200).json({
            status: 'success',
            data: {
                subscription,
                planName: subscription.planId.name

            }

        })
    }

}
)

exports.getUpcomingSessions = catchAsync(async (req, res, next) => {

    const userId = req.user.id

    const currentDate = Date.now()

    const Sessions = await Session.find({ userId: userId, date: { $gt: currentDate } })
        .sort({ date: 1 })
        .limit(4)
        .populate({
            path: 'therapistId',
            select: 'firstName lastName profile.avatar',
            model: 'Therapist'
        });

    if (!Sessions || Sessions.length < 0) throw new AppError('No upcoming sessions for this user', 404)



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


    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                gender: user.gender,
            },

        }
    });

})


exports.rescheduleSession = catchAsync(async (req, res, next) => {
    validationService.validateRescheduleSession(req.body);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const sessionId = req.params.id;
        const { newDate, newTime } = req.body;

        // 1. Find the session
        const sessionDoc = await Session.findOne({ _id: sessionId, userId: userId }).session(session);

        if (!sessionDoc) {
            throw new AppError('Session not found or does not belong to this user', 404);
        }

        // 2. Check if session is already completed or canceled
        if (sessionDoc.status === 'completed' || sessionDoc.status === 'canceled') {
            throw new AppError('Cannot reschedule a completed or canceled session', 400);
        }

        // 3. Update session details
        sessionDoc.date = newDate;
        sessionDoc.scheduledTime = newTime;
        sessionDoc.status = 'rescheduled';

        await sessionDoc.save({ session: session });

        // 4. Notify therapist (Optional - can be added later)
        // const io = req.app.get('io');
        // const notifier = new NotificationService(io);
        // await notifier.notifySessionRescheduled(...)

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            status: 'success',
            data: {
                session: sessionDoc
            }
        })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
})