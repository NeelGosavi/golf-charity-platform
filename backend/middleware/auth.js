const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user in MongoDB - use _id
        const user = await User.findById(decoded.id).select('-password_hash');
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user; // This gives you access to req.user._id
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };