// modules/directory/directoryRoutes.js
const express = require('express');
const DirectoryController = require('./directoryController');
const AuthMiddleware = require('../authentication/authMiddleware');

const router = express.Router();

// All directory routes require login
router.use(AuthMiddleware.protect);

router.get('/search', DirectoryController.search);
router.get('/departments', DirectoryController.getDepartments);
router.get('/staff/:staffId', DirectoryController.getProfile);

module.exports = router;
