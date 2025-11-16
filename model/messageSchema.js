const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Users', 'Therapist']
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['Users', 'Therapist']
    },
    // Encrypted message content
    encryptedContent: {
        type: String,
        required: true
    },
    // Encryption metadata
    encryptionKey: {
        type: String, // This should be encrypted/hashed in production
        required: false // For E2E, this won't be stored on server
    },
    iv: {
        type: String, // Initialization vector for encryption
        required: true
    },
    tag: {
        type: String, // Authentication tag for GCM mode
        required: true
    },
    // Message metadata
    messageType: {
        type: String,
        enum: ['text', 'file', 'image', 'system'],
        default: 'text'
    },
    // For file/image messages
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    // Message status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    // Timestamps
    readAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

