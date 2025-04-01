const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

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

    bioData: {
        type: String,
        default: ''
    },

    expertise: {
        type: String,
        required: [true, 'Your area of specialization is required']
    },

    licenseNo: {
        type: Number,
        required:true,
        unique:true
    },

    profilePic: {
        type: String,
        default: ''
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

    otp:{
        type: String,
        default: null
    },

    otpCreationTime:{
        type: Date,
        default: null
    }

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
        return ret;
    }
});

const Therapists = mongoose.model('Therapist', therapistSchema)

module.exports = Therapists