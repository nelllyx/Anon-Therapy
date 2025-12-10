const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect, restrictTo } = require('../services/authenticationService');

// Public routes
router.post('/signup', userController.signUp);


// Protected routes
router.use(protect, restrictTo('client'),);
router.post('/subscriptions', userController.createSubscriptions);
router.post('/session', userController.createBooking);
router.post('/payment/initialize', userController.initializePayment);
router.get('/payment/verify/:reference', userController.confirmPayment);
router.get('/payment-history', userController.checkPaymentHistory);
router.get('/subscription/plan', userController.checkActiveSubscription);
router.get('/sessions', userController.getUpcomingSessions);
router.get('/dashboard', userController.getDashboard);
router.patch('/reschedule-session/:id', userController.rescheduleSession);



module.exports = router; 