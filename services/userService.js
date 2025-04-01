const User = require('../model/userSchema')
const Booking = require('../model/userBooking')

exports.createUser = async(userData)=>{
    return User.create(userData)
}

exports.createBooking = async(bookingData) =>{
    return  Booking.create(bookingData)
}



