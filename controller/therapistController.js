const catchAsync = require('../exceptions/catchAsync')
const therapist = require('../model/therapistSchema')
const auth = require('../services/authenticationService')
const {transporter} = require("../config/nodeMailer");
const AppError = require('../exceptions/AppErrors');


 exports.register = catchAsync(
    async (req,res,next)=>{

        const existingTherapist = await therapist.findOne({email: req.body.email})

        if(existingTherapist)throw  new appError("Email already exist", 400)

        const newTherapist = await therapist.create(req.body)

        await auth.generateUserOtp(newTherapist)

        await transporter.sendMail(auth.sendOtpToUserEmail(newTherapist.email, newTherapist.otp, newTherapist.firstName),(err, info) =>{

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


exports.updatePassword = catchAsync( async (req, res, next) => {

    const userId = req.user.id
    const password = req.body

    const Therapist = await  therapist.findOne (userId)

    if(!Therapist) return next(new AppError("User not found", 400))


    if(! await therapist.correctPassword(password)) return next(new AppError("Incorrect password", 400))

    therapist.password = password

    await therapist.save
    

    res.status(201).json({
        status: 'success',
        data:{
            therapist: newTherapist
        }

    })


})


