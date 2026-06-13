// modules/authentication/passwordUtils.js
const bcrypt = require('bcryptjs');

class PasswordUtils {
    /**
     * Hash a plain text password
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password
     */
    static async hashPassword(password) {
        // Generate salt with 10 rounds (higher = more secure but slower)
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    /**
     * Compare a plain text password with a hash
     * @param {string} plainPassword - Plain text password from login form
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} - True if passwords match
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} - { isValid: boolean, errors: string[] }
     */
    static validatePasswordStrength(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = PasswordUtils;