const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { protect, restrictTo } = require('../services/authenticationService');

// Public routes
router.post('/login', adminController.loginAdmin);

// Protected routes (require admin authentication)
router.use(protect);
router.use(restrictTo('Admin'));

// Admin profile routes
router.get('/profile', adminController.getAdminProfile);
router.patch('/profile', adminController.updateAdminProfile);
router.patch('/change-password', adminController.changeAdminPassword);

// Plan management routes
router.post('/plans', adminController.createPlan);

// Internal route for creating admin (should be protected by additional middleware)
router.post('/create', adminController.createAdmin);

module.exports = router; 