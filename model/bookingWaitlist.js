const mongoose =  require('mongoose')


const bookingWaitlist = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    userSubscriptionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "userSubscription",
        required: true
    },



})