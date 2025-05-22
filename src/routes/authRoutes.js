// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth } = require('../controllers/authController');
const { googleCallback } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/authMiddleware');


// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth); // Keep existing route
router.post('/google/callback', googleCallback); // Add new route

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;