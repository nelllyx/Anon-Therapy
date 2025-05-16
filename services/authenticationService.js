const Client = require('../model/userSchema')
const Therapist = require('../model/therapistSchema')
const  jwt = require('jsonwebtoken')
const catchAsync = require("../exceptions/catchAsync");
const AppError = require("../exceptions/AppErrors");
const crypto = require('crypto')


exports.signUpToken = (id, role) =>{
    return jwt.sign({id, role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
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


exports.otpVerification = async (otp, Model, userId ) => {

    const currentTime = Date.now()
    const user = await Model.findById(userId)
    if(!user)throw new AppError('User not found', 404)
    if(!user.otp || !user.otpCreationTime) throw new AppError('Otp not generated or already used.',404)


    const timeDifference = currentTime - user.otpCreationTime.getTime()
    const fifteenMinutes = 15 * 60 * 1000
    if(timeDifference > fifteenMinutes){
        user.otp = null
        user.otpCreationTime = null
        await user.save()
        throw new AppError('OTP has expired. Please request for a new one.', 400)
    }

   const realOtp =   user.otp
    if(realOtp !== otp)throw new AppError("Invalid otp", 400)

    user.isVerified = true
    user.otp = undefined
    user.otpCreationTime = undefined
    await user.save()
    return exports.signUpToken(userId)
}


exports.login = catchAsync( async (req, res, Model) =>{

    const {email, password} = req.body

    if(!email || !password)throw new AppError("Email and password required", 400)

    const user = await Model.findOne({email})



    if(!user)throw new AppError("User not found", 404)
    if(!user || (! await user.correctPassword(password))) throw  new AppError("Invalid Email or Password", 401)
    if(user.isVerified === false)throw new AppError("Please complete your email verification", 401)

    const  token = exports.signUpToken(user._id)

    res.status(200).json({
        status: 'success',
        token
    })
})

const getUserByIdAndRole = async (id,role)=>{
    let user;
    switch (role){
        case 'client':
            user = await Client.findById(id);
            break;
        case 'Therapist':
            user = await Therapist.findById(id);
            break;
        default:
            throw new AppError('Invalid user role', 400)
    }
    if(!user){
        throw new AppError('User not found ', 404)
    }

    return user
}

exports.protect = catchAsync (async (req,res,next)=>{

    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        throw new AppError('Please Login to gain access', 401)
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await getUserByIdAndRole(decoded.id, decoded.role)


    next()
})

exports.restrictTo = (...roles)=>{
    return(req, res, next)=>{
        if(!roles.includes(req.user.role)){
        throw new AppError('You do not have permission to perform this action', 403)
        }



        next()
    }

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