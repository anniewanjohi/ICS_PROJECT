// modules/authentication/authController.js
const UserModel = require('./userModel');
const PasswordUtils = require('./passwordUtils');
const JWTUtils = require('./jwtUtils');
const { logAction } = require('../../utils/logger');

class AuthController {

    static async register(req, res) {
        try {
            const { email, password, role, profileData } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            if (!email.toLowerCase().endsWith('@strathmore.edu')) {
                return res.status(400).json({
                    success: false,
                    message: 'You must register with a valid Strathmore University email (@strathmore.edu)'
                });
            }

            const emailRegex = /^[^\s@]+@strathmore\.edu$/i;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            const passwordCheck = PasswordUtils.validatePasswordStrength(password);
            if (!passwordCheck.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet requirements',
                    errors: passwordCheck.errors
                });
            }

            const requestedRole = role || 'student';
            if (requestedRole === 'admin') {
                return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered' });
            }

            if (!['student', 'staff'].includes(requestedRole)) {
                return res.status(400).json({ success: false, message: 'Role must be student or staff' });
            }

            const existing = await UserModel.findByEmail(email.toLowerCase());
            if (existing) {
                return res.status(409).json({ success: false, message: 'An account with this email already exists' });
            }

            const passwordHash = await PasswordUtils.hashPassword(password);
            const newUser = await UserModel.create(email.toLowerCase(), passwordHash, requestedRole);

            // Derive name from email e.g. jane.doe@strathmore.edu -> Jane Doe
            const emailLocalPart = email.split('@')[0];
            const emailParts = emailLocalPart.split('.');
            const derivedFirstName = profileData?.firstName ||
                (emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'User');
            const derivedLastName = profileData?.lastName ||
                (emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '');

            let profile = null;
            try {
                if (requestedRole === 'student') {
                    profile = await UserModel.createStudentProfile(newUser.user_id, {
                        firstName: derivedFirstName,
                        lastName: derivedLastName,
                        studentRegNo: profileData?.studentRegNo || `STU-${newUser.user_id}-${Date.now().toString().slice(-5)}`,
                        program: profileData?.program || 'Not specified',
                        yearOfStudy: profileData?.yearOfStudy || null,
                        department: profileData?.department || null,
                    });
                } else if (requestedRole === 'staff') {
                    profile = await UserModel.createStaffProfile(newUser.user_id, {
                        firstName: derivedFirstName,
                        lastName: derivedLastName,
                        staffNumber: profileData?.staffNumber || `STAFF-${newUser.user_id}-${Date.now().toString().slice(-5)}`,
                        staffType: profileData?.staffType || 'lecturer',
                        departmentId: profileData?.departmentId || null,
                        title: profileData?.title || null,
                        position: profileData?.position || null,
                        officeLocation: profileData?.officeLocation || null,
                        officialEmail: email.toLowerCase(),
                    });
                }
            } catch (profileError) {
                console.error('Profile creation error (non-fatal):', profileError.message);
            }

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

    static async logout(req, res) {
        await logAction(req.user.userId, 'USER_LOGOUT', 'users', req.user.userId, req);
        return res.status(200).json({ success: true, message: 'Logged out. Remove token on client side.' });
    }

    static async forgotPassword(req, res) {
        return res.status(200).json({
            success: true,
            message: 'If an account exists with that email, you will receive reset instructions shortly.'
        });
    }
}

module.exports = AuthController;