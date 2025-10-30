const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        default: 'info',
    },

    title: String,

    message: String,

    data: Object,

    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,

    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
