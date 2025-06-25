const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect } = require('../services/authenticationService');

// Public routes
router.post('/signup', userController.signUp);


// Protected routes
router.use(protect);
router.post('/subscriptions', userController.createSubscriptions);
router.post('/payment/initialize', userController.initializePayment);
router.get('/payment/verify/:reference', userController.confirmPayment);
router.get('/payment-history', userController.checkPaymentHistory);
router.get('/subscription/plan', userController.checkPHistory);


module.exports = router; 