// modules/authentication/authController.js
const UserModel = require('./userModel');
const PasswordUtils = require('./passwordUtils');
const JWTUtils = require('./jwtUtils');

class AuthController {
    /**
     * Handle user login
     * POST /api/auth/login
     * Body: { email, password }
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user by email
            const user = await UserModel.findByEmail(email);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user account is active
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact administrator.'
                });
            }

            // Verify password
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

            // Update last login timestamp
            await UserModel.updateLastLogin(user.user_id);

            // Generate JWT token
            const token = JWTUtils.generateToken(user);

            // Get user with profile data
            const userWithProfile = await UserModel.getUserWithProfile(user.user_id);

            // Return success response
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
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred. Please try again later.'
            });
        }
    }

    /**
     * Handle user registration (for new students/staff)
     * POST /api/auth/register
     * Body: { email, password, role, profileData }
     */
    static async register(req, res) {
        try {
            const { email, password, role, profileData } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Validate email format (basic)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address'
                });
            }

            // Validate password strength
            const passwordValidation = PasswordUtils.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet security requirements',
                    errors: passwordValidation.errors
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists'
                });
            }

            // Hash the password
            const hashedPassword = await PasswordUtils.hashPassword(password);

            // Create user
            const newUser = await UserModel.create(
                email, 
                hashedPassword, 
                role || 'student'
            );

            // TODO: Create role-specific profile (student/staff)
            // This will be implemented in the next phase

            // Generate token for immediate login
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
                message: 'An internal server error occurred. Please try again later.'
            });
        }
    }

    /**
     * Verify current token and get user info
     * GET /api/auth/verify
     * Header: Authorization: Bearer <token>
     */
    static async verifyToken(req, res) {
        try {
            // The user is already attached to req by authMiddleware
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
                data: {
                    user: userWithProfile
                }
            });

        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred'
            });
        }
    }

    /**
     * Logout (client-side token removal - no server action needed with JWT)
     * POST /api/auth/logout
     */
    static async logout(req, res) {
        // With JWT, logout is handled client-side by removing the token
        // This endpoint exists for consistency and potential future blacklisting
        return res.status(200).json({
            success: true,
            message: 'Logout successful. Please remove your token on client side.'
        });
    }

    /**
     * Request password reset
     * POST /api/auth/forgot-password
     * Body: { email }
     */
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
            
            // For security, always return success even if email doesn't exist
            // This prevents email enumeration attacks
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: 'If an account exists with that email, you will receive password reset instructions.'
                });
            }

            // TODO: Generate reset token and send email
            // This will be implemented in a future phase

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