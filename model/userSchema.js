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
        minLength: 8
    },

    confirmPassword: {
        type: String,
        required:[true, 'Please confirm your password'],
        validate: function (pass){
            return pass === this.password
        }
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
    }

})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)

        this.confirmPassword = undefined

        next()
    } catch(error) {
        next(error)
    }


    next()
})


const Users = mongoose.model('Users', userSchema)

module.exports = Users