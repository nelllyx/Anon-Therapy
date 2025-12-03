
const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    type: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    data: {
        type: Object,
        default: {}
    },

    read: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
        index: { expires: 0 }
    }

})

const Notifications = mongoose.model('Notifications', notificationSchema)

module.exports = Notifications


