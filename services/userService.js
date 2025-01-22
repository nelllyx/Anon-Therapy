const User = require('../model/userSchema')


exports.createUser = async(userData)=>{
    return User.create(userData)
}

function calcAge(){
    return null
}