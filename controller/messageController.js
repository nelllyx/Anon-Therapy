const catchAsync = require('../exceptions/catchAsync');
const AppError = require('../exceptions/AppErrors');
const Message = require('../model/messageSchema');
const Conversation = require('../model/conversationSchema');
const encryptionService = require('../services/encryptionService');
const { Types } = require('mongoose');
const User = require('../model/userSchema');
const Therapist = require('../model/therapistSchema');
const mongoose = require('mongoose');
const validationService = require('../services/validationService');

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (userId1, userModel1, userId2, userModel2, sessionId = null, session = null) => {
    // Find existing conversation
    let conversation = await Conversation.findOne({
        $and: [
            { 'participants.userId': userId1, 'participants.userModel': userModel1 },
            { 'participants.userId': userId2, 'participants.userModel': userModel2 }
        ]
    }).session(session);

    if (!conversation) {
        // Create new conversation
        // Conversation.create returns an array when options are passed, so we take the first element
        const [newConversation] = await Conversation.create([{
            participants: [
                { userId: userId1, userModel: userModel1, lastSeen: new Date() },
                { userId: userId2, userModel: userModel2, lastSeen: new Date() }
            ],
            sessionId: sessionId || null,
            unreadCounts: new Map([
                [userId1.toString(), 0],
                [userId2.toString(), 0]
            ])
        }], { session: session });
        conversation = newConversation;
    }

    return conversation;
};

/**
 * Send a new message
 */
exports.sendMessage = catchAsync(async (req, res, next) => {
    validationService.validateSendMessage(req.body);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderId = req.user.id;
        const senderRole = req.user.role;
        const { receiverId, receiverRole, message, messageType = 'text', fileUrl = null, fileName = null, sessionId = null } = req.body;

        // Validate receiver
        if (!receiverId || !receiverRole) {
            throw new AppError('Receiver ID and role are required', 400);
        }

        // Determine sender and receiver models
        const senderModel = senderRole === 'therapist' ? 'Therapist' : 'Users';
        const receiverModel = receiverRole === 'therapist' ? 'Therapist' : 'Users';

        // Validate receiver exists
        const ReceiverModel = receiverRole === 'therapist' ? Therapist : User;
        const receiver = await ReceiverModel.findById(receiverId).session(session);
        if (!receiver) {
            throw new AppError('Receiver not found', 404);
        }

        // Get or create conversation
        const conversation = await getOrCreateConversation(
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            sessionId,
            session
        );

        // Encrypt the message
        const encrypted = encryptionService.encrypt(message);

        // Create message
        const [newMessage] = await Message.create([{
            conversationId: conversation._id,
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            encryptedContent: encrypted.encryptedContent,
            iv: encrypted.iv,
            tag: encrypted.tag,
            messageType,
            fileUrl,
            fileName,
            status: 'sent'
        }], { session: session });

        // Update conversation
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageAt = new Date();

        // Increment unread count for receiver
        const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
        conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);

        await conversation.save({ session: session });

        await session.commitTransaction();
        session.endSession();

        // Emit real-time message via socket
        const io = req.app.get('io');
        if (io) {
            const messageData = {
                messageId: newMessage._id,
                conversationId: conversation._id,
                senderId: senderId.toString(),
                receiverId: receiverId.toString(),
                message: message, // Decrypted for real-time delivery
                messageType,
                fileUrl,
                fileName,
                status: 'sent',
                createdAt: newMessage.createdAt,
                timestamp: newMessage.createdAt
            };

            // Emit to conversation room
            const conversationRoom = `conversation_${conversation._id}`;
            io.to(conversationRoom).emit('message_received', messageData);

            // Also send to receiver's personal room
            const receiverRoom = `user_${String(receiverId)}`;
            io.to(receiverRoom).emit('message_received', messageData);
        }

        res.status(201).json({
            status: 'success',
            data: {
                message: {
                    id: newMessage._id,
                    conversationId: conversation._id,
                    senderId,
                    receiverId,
                    messageType,
                    fileUrl,
                    fileName,
                    status: 'sent',
                    createdAt: newMessage.createdAt
                }
            }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

/**
 * Get messages for a conversation
 */
exports.getMessages = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return next(new AppError('Conversation not found', 404));
    }

    const isParticipant = conversation.participants.some(
        p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
        return next(new AppError('You are not a participant in this conversation', 403));
    }

    // Get messages
    const skip = (page - 1) * limit;
    const messages = await Message.find({
        conversationId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate('senderId', 'username firstName lastName')
        .populate('receiverId', 'username firstName lastName');

    // Decrypt messages
    const decryptedMessages = messages.map(msg => {
        try {
            const decryptedContent = encryptionService.decrypt({
                encryptedContent: msg.encryptedContent,
                iv: msg.iv,
                tag: msg.tag
            });

            return {
                id: msg._id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                message: decryptedContent,
                messageType: msg.messageType,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                status: msg.status,
                readAt: msg.readAt,
                deliveredAt: msg.deliveredAt,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt
            };
        } catch (error) {
            console.error('Error decrypting message:', error);
            return {
                id: msg._id,
                error: 'Failed to decrypt message'
            };
        }
    });

    res.status(200).json({
        status: 'success',
        results: decryptedMessages.length,
        data: {
            messages: decryptedMessages.reverse() // Reverse to show oldest first
        }
    });
});

/**
 * Get all conversations for a user
 */
exports.getConversations = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const conversations = await Conversation.find({
        'participants.userId': userId,
        isArchived: false
    })
        .sort({ lastMessageAt: -1 })
        .populate('lastMessage')
        .populate('participants.userId', 'username firstName lastName email')
        .populate('sessionId', 'date scheduledTime');

    const conversationsWithUnread = conversations.map(conv => {
        const otherParticipant = conv.getOtherParticipant(userId);
        const unreadCount = conv.unreadCounts.get(userId.toString()) || 0;

        return {
            id: conv._id,
            otherParticipant: otherParticipant,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount,
            sessionId: conv.sessionId,
            createdAt: conv.createdAt
        };
    });

    res.status(200).json({
        status: 'success',
        results: conversationsWithUnread.length,
        data: {
            conversations: conversationsWithUnread
        }
    });
});

/**
 * Mark messages as read
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
    validationService.validateMarkAsRead(req.params);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        // Validate conversation
        const conversation = await Conversation.findById(conversationId).session(session);
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        const isParticipant = conversation.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new AppError('You are not a participant in this conversation', 403);
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                conversationId,
                receiverId: userId,
                status: { $in: ['sent', 'delivered'] }
            },
            {
                $set: {
                    status: 'read',
                    readAt: new Date()
                }
            },
            { session: session }
        );

        // Reset unread count
        conversation.unreadCounts.set(userId.toString(), 0);
        await conversation.save({ session: session });

        await session.commitTransaction();
        session.endSession();

        // Emit read receipt via socket
        const io = req.app.get('io');
        if (io) {
            const conversationRoom = `conversation_${conversationId}`;
            io.to(conversationRoom).emit('messages_read', {
                conversationId,
                readBy: userId.toString(),
                readAt: new Date()
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Messages marked as read'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

/**
 * Mark message as delivered
 */
exports.markAsDelivered = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    if (message.receiverId.toString() !== userId.toString()) {
        return next(new AppError('You are not the receiver of this message', 403));
    }

    if (message.status === 'sent') {
        message.status = 'delivered';
        message.deliveredAt = new Date();
        await message.save();

        // Emit delivery receipt via socket
        const io = req.app.get('io');
        if (io) {
            const conversationRoom = `conversation_${message.conversationId}`;
            io.to(conversationRoom).emit('message_delivered_receipt', {
                messageId: message._id,
                conversationId: message.conversationId,
                deliveredTo: userId.toString(),
                deliveredAt: message.deliveredAt
            });
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Message marked as delivered'
    });
});

/**
 * Delete a message
 */
exports.deleteMessage = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    // Only sender can delete
    if (message.senderId.toString() !== userId.toString()) {
        return next(new AppError('You can only delete your own messages', 403));
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
        status: 'success',
        message: 'Message deleted'
    });
});
