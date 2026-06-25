// modules/authentication/jwtUtils.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtils {
    static generateToken(user) {
        const payload = {
            userId: user.user_id,
            email: user.email,
            role: user.role
        };
        // Note: env var is JWT_EXPIRE (not JWT_EXPIRES_IN) — matches .env
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        });
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        return authHeader.substring(7);
    }
}

module.exports = JWTUtils;
