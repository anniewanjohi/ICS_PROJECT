// modules/authentication/jwtUtils.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtils {
    /**
     * Generate a JWT token for a user
     * @param {object} user - User object containing id, email, and role
     * @returns {string} - JWT token
     */
    static generateToken(user) {
        // Payload contains user information (don't include sensitive data)
        const payload = {
            userId: user.user_id,
            email: user.email,
            role: user.role
        };
        
        // Sign the token with secret and expiration
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        return token;
    }

    /**
     * Verify and decode a JWT token
     * @param {string} token - JWT token from request header
     * @returns {object|null} - Decoded payload or null if invalid
     */
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            // Token is invalid, expired, or malformed
            if (error.name === 'TokenExpiredError') {
                console.error('Token expired');
            } else if (error.name === 'JsonWebTokenError') {
                console.error('Invalid token');
            }
            return null;
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value (e.g., "Bearer token123")
     * @returns {string|null} - Token or null if not found
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        
        // Remove 'Bearer ' prefix and return the token
        return authHeader.substring(7);
    }

    /**
     * Decode token without verification (for debugging only)
     * @param {string} token - JWT token
     * @returns {object|null} - Decoded payload
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }
}

module.exports = JWTUtils;