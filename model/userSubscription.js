const mongoose = require('mongoose')


const userSubscriptionSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    therapistId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Therapist",
        required: true
    },

    subscriptionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true
    },

    therapyType:{
        type: String,
        required: true
    },

    selectedDay: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        required: true
    },

    preferredTime: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening'],
        required: true
    },

    startDate: Date,

    endDate: Date,

    status: {
        type: String,
        enum: ['active', 'waitlisted', 'expired']
    },

    sessionsBooked: {
      type: Number
    },

    maxSession : {
      type: Number,
    },


    createdAt: Date,

    updatedAt: Date

})

const UserSubscription = mongoose.model('userSubscription',userSubscriptionSchema)

module.exports = UserSubscription