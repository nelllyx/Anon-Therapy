const Client = require('../model/userSchema')
const Therapist = require('../model/therapistSchema')
const  jwt = require('jsonwebtoken')
const catchAsync = require("../exceptions/catchAsync");
const AppError = require("../exceptions/AppErrors");
const crypto = require('crypto')
const userRoles = require('../config/userRoles')
const {generateResetEmail, generateOtpEmail} = require('../config/nodeMailer')
const RefreshToken = require("../model/refreshToken");
const { randomBytes } = require('crypto');
const bcrypt = require('bcryptjs');


const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

const getCookieBaseOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict': 'lax',
    path: '/'
})

exports.setAuthCookies = (res, accessToken, refreshToken) => {

    const base = getCookieBaseOptions()
    const accessTtlMs = (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m')
    const refreshTtlMs = (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d')

    const toMs = (ttl) => {
        if(typeof ttl === 'number') return ttl
        if(ttl.endsWith ('ms')) return parseInt(ttl)
        if(ttl.endsWith ('s')) return parseInt(ttl) * 1000
        if(ttl.endsWith ('m')) return parseInt(ttl) * 60 * 1000
        if(ttl.endsWith ('h')) return parseInt(ttl) * 60 * 60 * 1000
        if(ttl.endsWith ('d')) return parseInt(ttl) * 24 * 60 * 1000
    }

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        ...base,
        maxAge: toMs(accessTtlMs)
    })

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        ...base,
        maxAge: toMs(refreshTtlMs)
    })

}

exports.clearAuthCookies = (res) => {
    const base = getCookieBaseOptions()
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, base)
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, base)

}

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex')
};

const hashToken = async (token) => {
    return await bcrypt.hash(token, 10);
};

exports.saveRefreshToken = async (userId, userType, expiresInDays = 7) => {

    const rawToken = generateRefreshToken();

    const hashedToken = await hashToken(rawToken);

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const refreshToken = await RefreshToken.create({
        token: hashedToken,
        userId,
        userType,
        expiresAt,
    });

    return `${refreshToken._id.toString()}.${rawToken}`
};

exports.otpVerification = async (otp, Model, userId) => {

    const currentTime = Date.now();
    const user = await Model.findById(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.otp || !user.otpCreationTime) {
        throw new AppError('OTP not generated or already used.', 404);
    }

    const timeDifference = currentTime - user.otpCreationTime.getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (timeDifference > fifteenMinutes) {
        user.otp = null;
        user.otpCreationTime = null;
        await user.save();
        throw new AppError('OTP has expired. Please request for a new one.', 400);
    }

    const realOtp = user.otp;
    if (realOtp !== otp) {
        throw new AppError("Invalid OTP", 400);
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpCreationTime = undefined;
    await user.save();

    // Ensure we have both id and role before generating token
    if (!user._id || !user.role) {
        throw new AppError('Invalid user data for token generation', 500);
    }

}

exports.createAccessToken = (id, role) => {

    if (!id || !role) {
        throw new AppError('Invalid token data', 400);
    }

    if (!Object.values(userRoles).includes(role)) {
        throw new AppError('Invalid role for token', 400);
    }

    return jwt.sign(
        {
            id: id.toString(),
            role: role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
        }
    );
}

exports.generateUserOtp = catchAsync (async  (Model) => {

        const otpCreatedAt = Date.now()

        const uniqueDigits = new Set();

        while (uniqueDigits.size < 6) {
            // Generate a random byte and take its value modulo 10
            const randomByte = crypto.randomBytes(1)[0];
            const digit = randomByte % 10;
            uniqueDigits.add(digit);
        }

        Model.otp = Array.from(uniqueDigits).join('')
        Model.otpCreationTime = otpCreatedAt
        
        await Model.save()
        
        return true

})

exports.sendOtpToUserEmail = (email, otp, name) =>{

    const expiryTime = '15 minutes';
    const appName = 'Anonymous Therapy';
    const supportEmail = 'support@example.com';

    const { html, text } = generateOtpEmail(
        name,
        otp,
        expiryTime,
        appName,
        supportEmail
    );


    return {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: `🔑 Your OTP for ${appName} – Expires in ${expiryTime}!`,
        html: html

    }

}

exports.sendPasswordResetTokenToUserEmail = (resetLink, userName, userEmail) =>{

    const expiryTime = '10 minutes'; // Adjust as needed
    const appName = 'Anonymous Therapy';
    const supportEmail = 'support@example.com';

    const { html, text } = generateResetEmail(
        userName,
        resetLink,
        expiryTime,
        appName,
        supportEmail
    );

   return  {
        from: `"${appName}" <no-reply@process.env.SENDER_EMAIL>`,
        to: userEmail,
        subject: '🔒 Reset Your Password – Action Required',
        html: html,
    };

}

exports.getUserByIdAndRole = async (id, role) => {
    let user;
    
    // Validate role
    if (!role || !Object.values(userRoles).includes(role)) {
        throw new AppError('Invalid user role', 400);
    }

    switch (role) {
        case userRoles.CLIENT:
            user = await Client.findById(id);
            break;
        case userRoles.THERAPIST:
            user = await Therapist.findById(id);
            break;
        default:
            throw new AppError('Invalid user role', 400);
    }

    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
}

exports.protect = catchAsync(async (req, res, next) => {

    const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

    // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //     token = req.headers.authorization.split(' ')[1];
    // }

    if (!token) {
        throw new AppError('Please login to gain access', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        
        if (!decoded.id || !decoded.role) {
             new AppError('Invalid token format', 401);
        }

        req.user = await exports.getUserByIdAndRole(decoded.id, decoded.role);

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token. Please login again', 401);
        }
        if (error.name === 'TokenExpiredError') {
            res.clearCookie(ACCESS_TOKEN_COOKIE_NAME)
            throw new AppError('Your token has expired. Please login again', 401);
            //clearAuthCookies(res)

        }
        throw error;
    }
});

exports.restrictTo = (...roles)=>{

    return(req, res, next)=>{
        if(!roles.includes(req.user.role)){
        throw new AppError('You do not have permission to perform this action', 403)
        }



        next()
    }

}

exports.validateSelectedDay = function (selectedDay, plan) {

    const allowedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    if (plan === 'Basic') {

        if(Array.isArray(selectedDay)) throw new Error('Only one day can be selected.');

        if (!allowedDays.includes(selectedDay))throw new Error('Invalid day selected. Only weekdays (Monday-Friday) are allowed.');

    }else if( plan === 'Standard'){

        if(!Array.isArray(selectedDay) || selectedDay.length !== 2) throw new Error('Standard plan users must select exactly two days.');

        if (selectedDay.some(day => !allowedDays.includes(day))) {
            throw new Error('Invalid day(s) selected. Only weekdays (Monday-Friday) are allowed.');
        }

    }else if (plan === 'Premium'){
        if(Array.isArray(selectedDay) || selectedDay.length !== 4 ) throw new Error('Premium plan users must select exactly four days.');

        if (selectedDay.some(day => !allowedDays.includes(day))) {
            throw new Error('Invalid day(s) selected. Only weekdays (Monday-Friday) are allowed.');
        }
    }

    return true
}

exports.assignTherapistToClient = async function (User, subscriptionId, planType, subscriptionStatus, therapyType){

    const yearsOfExperience = {

        basic: { min: 0, max: 5, maxClients: 10 },
        standard: { min: 5, max: 15, maxClients: 7 },
        premium: { min: 6, max: 30, maxClients: 5 },
    }

    if(subscriptionStatus === 'subscribed'){

        if(!yearsOfExperience[planType.toLowerCase()] ) throw new AppError('Plan not found', 400)

        const {min, max , maxClients} = yearsOfExperience[planType.toLowerCase()]

        const eligibleTherapists = await Therapist.find({
            status: "active",
            yearsOfExperience:  {$gte: min, $lt: max },
            specialization: therapyType,
            currentClients: {$lt: maxClients}
        }).sort({currentClients: 1})

        if (eligibleTherapists.length === 0) {
            throw new Error("No available therapists for this plan.");

        }

        return eligibleTherapists[0]


    }


    return null
}

exports.validateInput = (req, res, next)=>{
    const {email, amount} = req.body
    if(!email || typeof email !== 'string'){
        return res.status(400).json({
            message: 'Valid email is required'
        })

    }
}

exports.createPasswordResetToken = function (Model){

    const resetToken = crypto.randomBytes(32).toString('hex')

    Model.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
   Model.passwordResetExpires = Date.now() + 10 * 60 * 1000

    Model.save()

    return resetToken
}

exports.calculateSubscriptionEndDate = function (firstSessionDate){
    const endDate = new Date(firstSessionDate);
    endDate.setDate(firstSessionDate.getDate() + 28);
    return endDate;
}

exports.generateSessionDates = (preferredDays, planType) => {

    planType = planType.charAt(0).toUpperCase() + planType.slice(1).toLowerCase();

    const sessionCount = { Basic: 4, Standard: 8, Premium: 16 }[planType];

    if (!sessionCount) {
        throw new Error(`Invalid plan type: ${planType}`);
    }

    const now = new Date();

    now.setHours(0, 0, 0, 0);


    // Map day names to numbers (0=Sunday, 1=Monday, etc.)
    const dayMap = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };

    // Convert preferred days to numbers (e.g., ["monday", "wednesday"] → [1, 3])
    const targetDays = preferredDays.map(day => dayMap[day.trim().toLowerCase()]);

    let date = new Date(now);

    let sessionsCreated = 0;

    const sessions = [];

    // Skip to the next occurrence of any preferred day
    while (!targetDays.includes(date.getDay())) {
        date.setDate(date.getDate() + 1);
    }

    const nowInstant = new Date();

    while (sessionsCreated < sessionCount) {

        const day = date.getDay();

        if (targetDays.includes(day)) {

            const sessionDate = new Date(date);

            if(sessionDate.getTime() > nowInstant.getTime()){
                // Only add the session if it's in the future (not today or past)
                sessionDate.setHours(12, 0, 0, 0);
                sessions.push(sessionDate); // Add to the sessions array
                sessionsCreated++;          // Increment the counter

            }

        }

        // Move to the next day
        date.setDate(date.getDate() + 1);
    }

    return sessions;
}

