const mongoose = require('mongoose')


const sessionSchema = new mongoose.Schema({

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

    plan:{
       type: String,
        required: true
    },

    therapyType:{
        type: String,
        required: true
    },

    startDate:{
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['active', 'expired']
    }


})

const ClientSessions = mongoose.model('clientSessions',sessionSchema)

module.exports = ClientSessions
