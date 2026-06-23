const UserModel = require('./userModel');
const PasswordUtils = require('./passwordUtils');
const JWTUtils = require('./jwtUtils');

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account has been deactivated. Contact administrator.'
                });
            }

            const isPasswordValid = await PasswordUtils.comparePassword(
                password, 
                user.password_hash
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            await UserModel.updateLastLogin(user.user_id);

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
                        profile: userWithProfile ? userWithProfile.profile : null
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred'
            });
        }
    }

    static async register(req, res) {
        try {
            const { email, password, role, profileData } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address'
                });
            }

            const passwordValidation = PasswordUtils.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet security requirements',
                    errors: passwordValidation.errors
                });
            }

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists'
                });
            }

            const hashedPassword = await PasswordUtils.hashPassword(password);
            const newUser = await UserModel.create(email, hashedPassword, role || 'student');

            const token = JWTUtils.generateToken(newUser);

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    token,
                    user: {
                        id: newUser.user_id,
                        email: newUser.email,
                        role: newUser.role
                    }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred'
            });
        }
    }

    static async verifyToken(req, res) {
        try {
            const userId = req.user.userId;
            const userWithProfile = await UserModel.getUserWithProfile(userId);
            
            if (!userWithProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: { user: userWithProfile }
            });

        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred'
            });
        }
    }

    static async logout(req, res) {
        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await UserModel.findByEmail(email);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with that email, you will receive password reset instructions.'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred'
            });
        }
    }
}

module.exports = AuthController;