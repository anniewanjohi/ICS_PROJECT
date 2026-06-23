const bcrypt = require('bcryptjs');

class PasswordUtils {
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) errors.push('Password must be at least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('Must contain a number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain special character');
        
        return { isValid: errors.length === 0, errors };
    }
}

module.exports = PasswordUtils;