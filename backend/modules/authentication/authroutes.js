// modules/authentication/authRoutes.js
const express = require('express');
const AuthController = require('./authController');
const AuthMiddleware = require('./authMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/forgot-password', AuthController.forgotPassword);

// Protected routes (authentication required)
router.post('/logout', AuthMiddleware.protect, AuthController.logout);
router.get('/verify', AuthMiddleware.protect, AuthController.verifyToken);

// Example of role-restricted route (commented for future use)
// router.get('/admin-only', 
//     AuthMiddleware.protect, 
//     AuthMiddleware.restrictTo('admin'), 
//     (req, res) => { res.json({ message: 'Admin access granted' }); }
// );

module.exports = router;