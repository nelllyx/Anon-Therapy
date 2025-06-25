const Client = require('../model/userSchema')
const Therapist = require('../model/therapistSchema')
const  jwt = require('jsonwebtoken')
const catchAsync = require("../exceptions/catchAsync");
const AppError = require("../exceptions/AppErrors");
const crypto = require('crypto')
const userRoles = require('../config/userRoles')
const ClientSubscription = require('../model/sessionSchema')

exports.signUpToken = (id, role) => {
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
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
}

exports.generateUserOtp = async function (Model){
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
}

exports.sendOtpToUserEmail = (email, otp, name) =>{

    return {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: `Welcome to Anonymous Therapy. Here's your verification code`,
        text: `Hi ${name} Welcome to Anonymous Therapy. Use the code below to complete your registration.
         ${otp}
         This code expires in 15 minutes.
         `

    }

}


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

    // Log the values being passed to signUpToken for debugging
    console.log('Token generation data:', {
        id: user._id.toString(),
        role: user.role
    });

    return exports.signUpToken(user._id, user.role);
}


exports.login = catchAsync( async (req, res, Model) =>{

    const {email, password} = req.body

    if(!email || !password)throw new AppError("Email and password required", 400)

    const user = await Model.findOne({email})



    if(!user)throw new AppError("User not found", 404)
    if(!user || (! await user.correctPassword(password))) throw  new AppError("Invalid Email or Password", 401)
    if(user.isVerified === false)throw new AppError("Please complete your email verification", 401)

    const  token = exports.signUpToken(user._id, user.role)

    res.status(200).json({
        status: 'success',
        token,
        user
    })
})

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
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new AppError('Please login to gain access', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.id || !decoded.role) {
            throw new AppError('Invalid token format', 401);
        }

        req.user = await exports.getUserByIdAndRole(decoded.id, decoded.role);
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token. Please login again', 401);
        }
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Your token has expired. Please login again', 401);
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

exports.assignTherapistToClient = async function (User, planType, subscriptionStatus, therapyType){

    const yearsOfExperience = {

        basic: { min: 0, max: 5, maxClients: 10 },
        standard: { min: 5, max: 15, maxClients: 7 },
        premium: { min: 6, max: 30, maxClients: 5 },
    }

    if(subscriptionStatus === 'subscribed'){

        if(!yearsOfExperience[planType] ) throw new AppError('Plan not found', 400)

        const {min, max , maxClients} = yearsOfExperience[planType.toLowerCase()]

        const eligibleTherapists = await Therapist.find({
            isActive: true,
            yearsOfExperience:  {$gte: min, $lt: max },
            specialization: therapyType,
            currentClients: {$lt: maxClients}
        }).sort({currentClients: 1})

        if (eligibleTherapists.length === 0) {
            throw new Error("No available therapists for this plan.");

        }

        const selectedTherapist = eligibleTherapists[0]


        const subscription = new ClientSubscription({
            userId: User._id,
            therapistId: selectedTherapist._id,
            plan: planType,
            therapyType: therapyType,
            startDate: new Date(),
            endDate: calculateSubscriptionEndDate(),
            status: 'active'
        });

        // Update therapist's client list
        await Therapist.findByIdAndUpdate(selectedTherapist._id, {
            $push: {
                clientSubscriptions: {
                    clientId: User._id,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: subscription.endDate,
                    status: 'active'
                }
            },
            $inc: { currentClients: 1 }
        });

        await subscription.save();

        return {
            therapist: selectedTherapist,
            subscription: subscription
        };

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

const createPasswordResetToken = function (Model){
    const resetToken = crypto.randomBytes(32).toString('hex')

    Model.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
   Model.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken
}

exports.forgotPassword = catchAsync( async (Model, req, res)=>{
    const {email} = req.body
   const user = await Model.findOne({email})
    if(!user){
        res.status(400).send( 'No user with such email')
    }

  const resetToken = createPasswordResetToken(user)

    await user.save()


})

const calculateSubscriptionEndDate = function (){
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
}

