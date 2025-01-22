const User = require("../model/userSchema")
const  jwt = require('jsonwebtoken')

exports.signUpToken = id =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}