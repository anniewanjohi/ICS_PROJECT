// modules/authentication/authMiddleware.js
const JWTUtils = require('./jwtUtils');
const UserModel = require('./userModel');

class AuthMiddleware {
    /**
     * Verify JWT token and attach user to request
     * This middleware protects routes that require authentication
     */
    static async protect(req, res, next) {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            // Verify token
            const decoded = JWTUtils.verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token. Please login again.'
                });
            }

            // Check if user still exists and is active
            const user = await UserModel.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists. Please contact support.'
                });
            }

            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact administrator.'
                });
            }

            // Attach user to request object for use in route handlers
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication failed. Please try again.'
            });
        }
    }

    /**
     * Restrict access to specific roles
     * @param {...string} roles - Allowed roles (e.g., 'admin', 'staff')
     * @returns {Function} - Middleware function
     */
    static restrictTo(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You do not have permission to perform this action.'
                });
            }

            next();
        };
    }

    /**
     * Optional authentication (doesn't fail if no token)
     * Attaches user if token exists and is valid
     */
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (token) {
                const decoded = JWTUtils.verifyToken(token);
                if (decoded) {
                    const user = await UserModel.findById(decoded.userId);
                    if (user && user.is_active) {
                        req.user = {
                            userId: decoded.userId,
                            email: decoded.email,
                            role: decoded.role
                        };
                    }
                }
            }
            next();
        } catch (error) {
            // Don't fail on error, just continue without user
            next();
        }
    }
}

module.exports = AuthMiddleware;