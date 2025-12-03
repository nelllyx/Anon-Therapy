const express = require('express');
const notificationController = require('../controller/notificationController');
const authService = require('../services/authenticationService');

const router = express.Router();

// Protect all routes after this middleware
router.use(authService.protect);

router.get('/get-notifications', notificationController.getMissedNotifications);
router.patch('/mark-read/:id', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/delete-all', notificationController.deleteAll);
router.delete('/delete/:id', notificationController.deleteSpecificNotification);

module.exports = router;
