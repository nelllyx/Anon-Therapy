const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const userRoles = require("../config/userRoles");

const therapistSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: [true, 'Please enter your first name']
    },

    lastName: {
        type: String,
        required: [true, 'Please enter your last name']
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'please enter a unique email'],
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: 8,
    },

    gender:{
        type: String,
        enum: ['male', 'female'],
        required: true
    },

    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },

    yearsOfExperience: {
        type: Number,
        maxLength:2,
      required: true,
    },

    specialization: {
        type: String,
        required: [true, 'Your area of specialization is required'],
        lowercase: true,
    },

    licenseNo: {
        type: Number,
        required:true,
        unique:true
    },

    profile: {
        education: String,
        certification: String,
        bio: String,
        avatar: String,
    },


    status: {
        type: String,
        enum: ['active', 'inactive', 'on leave'],
        default: 'active'
    },

    isVerified:{
        type:Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now()
    },

    role: {
        type: String,
        enum: Object.values(userRoles),
        default:  userRoles.THERAPIST,
        required: true,

    },

    otp:{
        type: String,
        default: null
    },

    otpCreationTime:{
        type: Date,
        default: null
    },

    currentClients: {
        type: Number,
        default: 0
     },

    maxClients: Number,
    
})

therapistSchema.pre('save',async function (next){
    if(!this.isModified('password')) return next()

    try {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    }catch(err){
        next(err)
    }

})

therapistSchema.methods.correctPassword = async function (candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password)
}

therapistSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete  ret.otp;
        return ret;
    }
});

const Therapists = mongoose.model('Therapist', therapistSchema)

module.exports = Therapists