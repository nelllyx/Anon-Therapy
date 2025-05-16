const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect } = require('../services/authenticationService');

// Public routes
router.post('/signup', userController.signUp);
router.post('/login', userController.login);

// Protected routes
router.use(protect);
router.post('/bookings', userController.createBookings);
router.post('/payment/initialize', userController.initializePayment);
router.get('/payment/verify/:reference', userController.confirmPayment);

module.exports = router; 