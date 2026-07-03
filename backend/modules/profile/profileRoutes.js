// modules/profile/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthMiddleware = require('../authentication/authMiddleware');
const { getPool, sql } = require('../../config/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${req.user.userId}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, GIF, and WEBP images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// POST /api/v1/profile/upload-picture
router.post('/upload-picture', AuthMiddleware.protect, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const pool = getPool();
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Update the appropriate profile table based on role
        if (req.user.role === 'student') {
            await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .input('profile_picture_url', sql.VarChar, imageUrl)
                .query('UPDATE dbo.students SET profile_picture_url = @profile_picture_url WHERE user_id = @user_id');
        } else if (req.user.role === 'staff' || req.user.role === 'admin') {
            await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .input('profile_picture_url', sql.VarChar, imageUrl)
                .query('UPDATE dbo.staff_profiles SET profile_picture_url = @profile_picture_url WHERE user_id = @user_id');
        }

        return res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: { imageUrl }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ success: false, message: 'Error uploading image' });
    }
});

// DELETE /api/v1/profile/remove-picture
router.delete('/remove-picture', AuthMiddleware.protect, async (req, res) => {
    try {
        const pool = getPool();

        if (req.user.role === 'student') {
            await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('UPDATE dbo.students SET profile_picture_url = NULL WHERE user_id = @user_id');
        } else {
            await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('UPDATE dbo.staff_profiles SET profile_picture_url = NULL WHERE user_id = @user_id');
        }

        return res.status(200).json({
            success: true,
            message: 'Profile picture removed'
        });

    } catch (error) {
        console.error('Remove picture error:', error);
        return res.status(500).json({ success: false, message: 'Error removing picture' });
    }
});

module.exports = router;