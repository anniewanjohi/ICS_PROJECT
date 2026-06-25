// modules/authentication/authController.js
const UserModel = require('./userModel');
const PasswordUtils = require('./passwordUtils');
const JWTUtils = require('./jwtUtils');
const { logAction } = require('../../utils/logger');

class AuthController {

    // POST /api/v1/auth/register
    static async register(req, res) {
        try {
            const { email, password, role, profileData } = req.body;

            // Basic presence check
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            // Must be a Strathmore email
            if (!email.toLowerCase().endsWith('@strathmore.edu')) {
                return res.status(400).json({
                    success: false,
                    message: 'You must register with a valid Strathmore University email (@strathmore.edu)'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@strathmore\.edu$/i;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            // Validate password strength
            const passwordCheck = PasswordUtils.validatePasswordStrength(password);
            if (!passwordCheck.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet requirements',
                    errors: passwordCheck.errors
                });
            }

            // Block self-registration as admin
            const requestedRole = role || 'student';
            if (requestedRole === 'admin') {
                return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered' });
            }

            if (!['student', 'staff'].includes(requestedRole)) {
                return res.status(400).json({ success: false, message: 'Role must be student or staff' });
            }

            // Check duplicate
            const existing = await UserModel.findByEmail(email.toLowerCase());
            if (existing) {
                return res.status(409).json({ success: false, message: 'An account with this email already exists' });
            }

            // Hash password and create user
            const passwordHash = await PasswordUtils.hashPassword(password);
            const newUser = await UserModel.create(email.toLowerCase(), passwordHash, requestedRole);

            // Create role-specific profile if profileData provided
            let profile = null;
            if (profileData) {
                if (requestedRole === 'student') {
                    profile = await UserModel.createStudentProfile(newUser.user_id, profileData);
                } else if (requestedRole === 'staff') {
                    profile = await UserModel.createStaffProfile(newUser.user_id, profileData);
                }
            }

            // Log registration
            await logAction(newUser.user_id, 'USER_REGISTERED', 'users', newUser.user_id, req);

            const token = JWTUtils.generateToken(newUser);

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    token,
                    user: {
                        id: newUser.user_id,
                        email: newUser.email,
                        role: newUser.role,
                        profile
                    }
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({ success: false, message: 'Server error during registration' });
        }
    }

    // POST /api/v1/auth/login
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const user = await UserModel.findByEmail(email.toLowerCase());
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            if (!user.is_active) {
                return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact the administrator.' });
            }

            const passwordValid = await PasswordUtils.comparePassword(password, user.password_hash);
            if (!passwordValid) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            await UserModel.updateLastLogin(user.user_id);
            await logAction(user.user_id, 'USER_LOGIN', 'users', user.user_id, req);

            const token = JWTUtils.generateToken(user);
            const userWithProfile = await UserModel.getUserWithProfile(user.user_id);

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user.user_id,
                        email: user.email,
                        role: user.role,
                        profile: userWithProfile.profile
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: 'Server error during login' });
        }
    }

    // GET /api/v1/auth/me  (protected)
    static async getMe(req, res) {
        try {
            const userWithProfile = await UserModel.getUserWithProfile(req.user.userId);
            if (!userWithProfile) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.status(200).json({ success: true, data: { user: userWithProfile } });
        } catch (error) {
            console.error('GetMe error:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // POST /api/v1/auth/logout  (protected)
    static async logout(req, res) {
        await logAction(req.user.userId, 'USER_LOGOUT', 'users', req.user.userId, req);
        return res.status(200).json({ success: true, message: 'Logged out. Remove token on client side.' });
    }

    // POST /api/v1/auth/forgot-password
    static async forgotPassword(req, res) {
        // Always return same message to prevent email enumeration
        return res.status(200).json({
            success: true,
            message: 'If an account exists with that email, you will receive reset instructions shortly.'
        });
        // TODO: implement email sending in next phase
    }
}

module.exports = AuthController;

