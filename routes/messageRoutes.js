const express = require('express');
const messageController = require('../controller/messageController');
const { protect } = require('../services/authenticationService');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send a message
router.post('/send', messageController.sendMessage);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Mark messages as read
router.patch('/conversations/:conversationId/read', messageController.markAsRead);

// Mark message as delivered
router.patch('/messages/:messageId/delivered', messageController.markAsDelivered);

// Delete a message
router.delete('/messages/:messageId', messageController.deleteMessage);

module.exports = router;

