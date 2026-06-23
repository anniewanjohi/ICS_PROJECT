const JWTUtils = require('./jwtUtils');
const UserModel = require('./userModel');

class AuthMiddleware {
    static async protect(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const decoded = JWTUtils.verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token.'
                });
            }

            const user = await UserModel.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists.'
                });
            }

            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated.'
                });
            }

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
                message: 'Authentication failed.'
            });
        }
    }

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
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();
        };
    }
}

module.exports = AuthMiddleware;