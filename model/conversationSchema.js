const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userModel: {
            type: String,
            required: true,
            enum: ['Users', 'Therapist']
        },
        lastSeen: {
            type: Date,
            default: Date.now
        }
    }],
    // Conversation metadata
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Unread message counts per participant
    unreadCounts: {
        type: Map,
        of: Number,
        default: new Map()
    },

    // Related session (if conversation is tied to a therapy session)
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clientSessions',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Method to get the other participant
conversationSchema.methods.getOtherParticipant = function(currentUserId) {
    const participant = this.participants.find(
        p => p.userId.toString() !== currentUserId.toString()
    );
    return participant;
};

// Method to update last seen
conversationSchema.methods.updateLastSeen = function(userId) {
    const participant = this.participants.find(
        p => p.userId.toString() === userId.toString()
    );
    if (participant) {
        participant.lastSeen = new Date();
    }
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;

