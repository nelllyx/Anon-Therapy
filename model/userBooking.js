const mongoose = require('mongoose')
const validator = require('validator')


const bookingSchema = new mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


 
    bookingCreationDate: {
        type: Date,
        default: Date.now()
    },

    plan: {
        type: String,
        required: true
    },

    status:{
        type: String,
        enum: ['pending','confirmed','completed','canceled'],
        default: 'pending'
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    }

})

const Bookings = mongoose.model('UserBooking',bookingSchema)

module.exports = Bookings