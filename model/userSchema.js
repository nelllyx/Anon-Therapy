const mongoose = require('mongoose')
const userRoles = require('../config/userRoles')
const validator = require('validator')
const bcrypt = require('bcryptjs')



const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, "Username required"],
        unique: true,
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },

    email: {
        type: String,
        required: [true, "Email address required"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"],
        trim: true,
        match: [/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/, 'Please enter a valid email'],
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
    },

    gender:{
        type: String,
        enum: ['male', 'female'],
        required: true
    },

    role: {
        type: String,
        enum: Object.values(userRoles),
        default:  userRoles.CLIENT,
        required: true,
    },

    isVerified:{
        type:Boolean,
        default: false
    },

    accountStatus: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'closed'],
        default: 'pending'
    },

    otp:{
        type: String,
        default: null
    },

    otpCreationTime:{
        type: Date,
        default: null
    },

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,


})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)

        next()
    } catch(error) {
        next(error)
    }


})

userSchema.methods.correctPassword = async function (candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000
    next()
})

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        return ret;
    }
});


const Users = mongoose.model('Users', userSchema)

module.exports = Users