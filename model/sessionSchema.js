const mongoose = require('mongoose')


const sessionSchema = new mongoose.Schema({

    userId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true
    },

    therapistId:{
       type: mongoose.Schema.Types.ObjectId,
        ref: "Therapist",
        required: true
    },

    therapyType:{
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: false,
    },

    startTime: {
        type: String,
        default: null,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },


    duration: {
        type: Number,
        default: 30
    },

    status: {
        type: String,
        enum: ["scheduled", "completed", "canceled", "no-show", "rescheduled"],
        default: "scheduled",
    },


    notes: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: new Date(),
    },

}, { timestamps: true})

const ClientSessions = mongoose.model('clientSessions',sessionSchema)

module.exports = ClientSessions
