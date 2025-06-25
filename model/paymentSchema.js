const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userBooking",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'abandoned'],
        default: 'pending'
    },

    dateOfPayment: {
        type: Date,
        default: Date.now()
    }

})

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment