const mongoose = require('mongoose')


function formatToDDMMYYYY(date) {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, '0'); // Ensures 2 digits (e.g., "05")
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}


const subscriptionSchema = new mongoose.Schema({

    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clientPlan",
        required: true
    },

    subscriptionCreationDate: {
        type: Date,
        default: Date.now()
    },

    status:{
        type: String,
        enum: ['pending','subscribed', 'waitlist', 'canceled', 'completed'],
        default: 'pending'
    },

    isSubscriptionActive: {
        type: Boolean,
        default: false
    },

    startDate: {
        type: Date,
        default: Date.now,
        get: formatToDDMMYYYY
    } ,

    endDate: {
        type: Date,
        get: formatToDDMMYYYY
    },

    sessionsPerWeek:{
        type: Number,
        required: true,
    },

    maxSession : {
        type: Number,
        required: true
    },


}, { toJSON: { getters: true } })



const Subscriptions = mongoose.model('Subscriptions',subscriptionSchema)

module.exports = Subscriptions