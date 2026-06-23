const express = require('express');
const AuthController = require('./authController');
const AuthMiddleware = require('./authMiddleware');

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/logout', AuthMiddleware.protect, AuthController.logout);
router.get('/verify', AuthMiddleware.protect, AuthController.verifyToken);

module.exports = router;