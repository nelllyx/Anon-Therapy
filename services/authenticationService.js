const User = require("../model/userSchema")
const  jwt = require('jsonwebtoken')
const catchAsync = require("../exceptions/catchAsync");
const AppError = require("../exceptions/AppErrors");

exports.signUpToken = id =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

exports.generateUserOtp = async function (Model){
    const otpCreatedAt = Date.now()

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for(let index = 0; index < 6; index++){
        const randomIndex = Math.floor(Math.random() * characters.length)
        result += characters[randomIndex]
    }
    Model.otp = result
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

exports.protect = catchAsync (async (req,res,next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
         token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        throw new AppError('Please Login to gain access', 401)
    }



    next()
})

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
    user.otp = null
    user.otpCreationTime = null
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
