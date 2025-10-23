const catchAsync = require('../exceptions/catchAsync')
const therapist = require('../model/therapistSchema')
const {transporter} = require("../config/nodeMailer");
const AppError = require('../exceptions/AppErrors');
const upload = require('../config/multerConfig')
const {sendOtpToUserEmail, generateUserOtp} = require("../services/authenticationService");
const Session = require('../model/sessionSchema');
const {Types} = require("mongoose");

// Separate multer middleware from the controller function
const uploadProfilePicture = upload.single('avatar');

exports.register = [
    uploadProfilePicture,
    catchAsync(async (req, res, next) => {
        const startTime = Date.now();
        const existingTherapist = await therapist.findOne({email: req.body.email})

        if(existingTherapist) {
            return next(new AppError("Email already exists", 400))
        }

            const profilePicture = req.file ? req.file.path : '';

            const newTherapist = await therapist.create({...req.body, profilePicture})
            console.log('Therapist created:', newTherapist);

            // Generate OTP for the new therapist
            console.log('Generating OTP...');
            await generateUserOtp(newTherapist)
            console.log('OTP generated successfully');

            // Send OTP email
            console.log('Sending OTP email...');
            const info = await transporter.sendMail(sendOtpToUserEmail(newTherapist.email, newTherapist.otp, newTherapist.firstName))
            console.log('Email sent successfully:', info.response);
        const endTime = Date.now();
        console.log(`Request processed in ${endTime - startTime}ms`);

        res.status(201).json({
            status: 'success',
            data:{
                therapist: newTherapist
            }
        })
    })
]

exports.updatePassword = catchAsync( async (req, res, next) => {
    const userId = req.user.id
    const {currentPassword, newPassword} = req.body

    const Therapist = await therapist.findById(userId)

    if(!Therapist) {
        return next(new AppError("User not found", 400))
    }

    if(!await Therapist.correctPassword(currentPassword)) {
        return next(new AppError("Incorrect password", 400))
    }

    Therapist.password = newPassword

    await Therapist.save()
    
    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
    })
})

exports.updateProfile = [
    uploadProfilePicture,
    catchAsync(async (req, res, next) => {

        const userId = req.user.id

        const userData = req.body

        const user = await therapist.findById(userId);

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        const userUpdates = {}

        if(userData.firstName) userUpdates.firstName = userData.firstName
        if(userData.lastName) userUpdates.lastName = userData.lastName
        if(userData.email) userUpdates.email = userData.email
        if(userData.phoneNumber) userUpdates.phoneNumber = userData.phoneNumber
        if(userData.specialization) userUpdates.specialization = userData.specialization
        if(userData.yearsOfExperience) userUpdates.yearsOfExperience = userData.yearsOfExperience


        if (userData.bio) userUpdates["profile.bio"] = userData.bio;
        if (userData.education) userUpdates["profile.education"] = userData.education;
        if (userData.certification) userUpdates["profile.certification"] = userData.certification;
        if (req.file) userUpdates["profile.avatar"] = req.file.path;



        const updatedProfile = await therapist.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    ...userUpdates,
                },
            },
            { new: true }

        )

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedProfile,
            },
        });

    })
]

exports.getSessionsForTheWeek = catchAsync( async (req, res, next) => {

    const therapistId = req.user.id

    const currentDate = new Date();

    const allSessions = await Session.find({therapistId: therapistId })
        .sort({ date: 1 })
        .limit(10)
        .populate({path: 'userId',
            select: 'username',
            model: 'Users'
        });



    if (!allSessions || allSessions.length === 0) {
        throw new AppError('No sessions found for this therapist', 404);
    }


    // Categorize sessions
    const upcomingSessions = allSessions.filter(
        session => new Date(session.date) > currentDate
    );

    const pastSessions = allSessions.filter(
        session => new Date(session.date) <= currentDate
    );

    const completedSessions = pastSessions.filter(
        session => session.status === 'completed'
    );

    const rescheduledSessions = pastSessions.filter(
        session => session.status === 'rescheduled'
    );


    // Implementation for getting sessions for the week
        res.status(200).json({
            status: 'success',
            message: 'Sessions for the week retrieved successfully',
                data: {
                    upcoming: upcomingSessions,
                    completed: completedSessions,
                    rescheduled: rescheduledSessions
                }
        })

    })

exports.assignTimeForSession = catchAsync( async (req, res, next) => {

    const {sessionId} = req.params

   const updates = req.body

    if (!Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ error: 'Invalid session ID' });
    }


    const validSession = await Session.findByIdAndUpdate(
        sessionId,
        {$set: updates },
        {new: true}
    )

    if(!validSession)  return next(new AppError("Session not found", 400))

    res.status(200).json({
        status: 'success',
        validSession
    })


})

exports.getDashboard = catchAsync(async (req, res, next) => {
    const therapistId = req.user.id;
    const currentDate = new Date();
    
    // Get start of week (Monday) and end of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get therapist profile information
    const therapist = await therapist.findById(therapistId).select('-password -otp');
    
    if (!therapist) {
        throw new AppError('Therapist not found', 404);
    }

    // Get today's sessions
    const todaySessions = await Session.find({
        therapistId: therapistId,
        date: {
            $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            $lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
        }
    })
    .populate({
        path: 'userId',
        select: 'username email gender'
    })
    .sort({ startTime: 1 });

    // Get this week's sessions
    const weeklySessions = await Session.find({
        therapistId: therapistId,
        date: {
            $gte: startOfWeek,
            $lte: endOfWeek
        }
    })
    .populate({
        path: 'userId',
        select: 'username email gender'
    })
    .sort({ date: 1, startTime: 1 });

    // Get upcoming sessions (next 7 days)
    const upcomingSessions = await Session.find({
        therapistId: therapistId,
        date: { $gt: currentDate }
    })
    .sort({ date: 1 })
    .limit(10)
    .populate({
        path: 'userId',
        select: 'username email gender'
    });

    // Get completed sessions count (all time)
    const completedSessionsCount = await Session.countDocuments({
        therapistId: therapistId,
        status: 'completed'
    });

    // Get total sessions count (all time)
    const totalSessionsCount = await Session.countDocuments({
        therapistId: therapistId
    });

    // Get client statistics
    const uniqueClients = await Session.distinct('userId', {
        therapistId: therapistId
    });

    // Get sessions by status for this week
    const weeklyStats = await Session.aggregate([
        {
            $match: {
                therapistId: therapistId,
                date: {
                    $gte: startOfWeek,
                    $lte: endOfWeek
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get sessions by therapy type
    const therapyTypeStats = await Session.aggregate([
        {
            $match: {
                therapistId: therapistId,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$therapyType',
                count: { $sum: 1 }
            }
        }
    ]);

    // Calculate weekly completion rate
    const weeklyCompleted = weeklyStats.find(stat => stat._id === 'completed')?.count || 0;
    const weeklyTotal = weeklySessions.length;
    const weeklyCompletionRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

    // Calculate overall completion rate
    const overallCompletionRate = totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;

    res.status(200).json({
        status: 'success',
        data: {
            therapist: {
                id: therapist._id,
                firstName: therapist.firstName,
                lastName: therapist.lastName,
                email: therapist.email,
                specialization: therapist.specialization,
                yearsOfExperience: therapist.yearsOfExperience,
                status: therapist.status,
                isVerified: therapist.isVerified,
                currentClients: therapist.currentClients,
                maxClients: therapist.maxClients,
                profile: therapist.profile,
                createdAt: therapist.createdAt
            },
            todaySessions: todaySessions.map(session => ({
                id: session._id,
                date: session.date,
                startTime: session.startTime,
                duration: session.duration,
                therapyType: session.therapyType,
                status: session.status,
                notes: session.notes,
                client: session.userId
            })),
            weeklySessions: weeklySessions.map(session => ({
                id: session._id,
                date: session.date,
                startTime: session.startTime,
                duration: session.duration,
                therapyType: session.therapyType,
                status: session.status,
                client: session.userId
            })),
            upcomingSessions: upcomingSessions.map(session => ({
                id: session._id,
                date: session.date,
                startTime: session.startTime,
                duration: session.duration,
                therapyType: session.therapyType,
                status: session.status,
                client: session.userId
            })),
            statistics: {
                totalSessions: totalSessionsCount,
                completedSessions: completedSessionsCount,
                uniqueClients: uniqueClients.length,
                todaySessions: todaySessions.length,
                weeklySessions: weeklySessions.length,
                upcomingSessions: upcomingSessions.length,
                overallCompletionRate: overallCompletionRate,
                weeklyCompletionRate: weeklyCompletionRate,
                clientCapacity: {
                    current: therapist.currentClients,
                    max: therapist.maxClients,
                    utilization: therapist.maxClients ? Math.round((therapist.currentClients / therapist.maxClients) * 100) : 0
                }
            },
            weeklyBreakdown: weeklyStats,
            therapyTypeBreakdown: therapyTypeStats
        }
    });
});

