const catchAsync = require('../exceptions/catchAsync')
const therapist = require('../model/therapistSchema')
const appError = require('../exceptions/AppErrors')
const auth = require('../services/authenticationService')
const transport = require("../config/nodeMailer");


exports.register = catchAsync(
    async (req,res,next)=>{

        const existingTherapist = await therapist.findOne({email: req.body.email})

        if(existingTherapist)throw  new appError("Email already exist", 400)


        const newTherapist = await therapist.create(req.body)


        await auth.generateUserOtp(newTherapist)

        await transport.sendMail(auth.sendOtpToUserEmail(newTherapist.email, newTherapist.otp, newTherapist.firstName),(err, info) =>{

            if(err){
                return console.error('Error occurred while sending email:', err)
            }
            console.log('Email sent successfully:', info.response)
        })

        res.status(201).json({
            status: 'success',
            data:{
                therapist: newTherapist
            }

        })

})

exports.vetifyOtp = catchAsync(async (req, res)=>{
    const {id, otp } = req.body
    const token  = await auth.otpVerification(otp, therapist, id)

    res.status(200).json({
        token
    })
})

exports.login = (req,res)=>{
    auth.login(req,res,therapist)
}