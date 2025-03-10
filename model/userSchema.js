const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')



const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, "Username required"],
        unique: true
    },

    email: {
        type: String,
        required: [true, "Email address required"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"]
    },

    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: 8,
    },

    //
    // dateOfBirth: {
    //     type: Date,
    //     required: true
    // },

    gender:{
        type: String,
        enum: ['male', 'female'],
        required: true
    },

    isVerified:{
        type:Boolean,
        default: false
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

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
});


const Users = mongoose.model('Users', userSchema)

module.exports = Users