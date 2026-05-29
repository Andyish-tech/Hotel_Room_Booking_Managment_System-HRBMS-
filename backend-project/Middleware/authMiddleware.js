// ============================================================
// Authentication Middleware
// Golden Stay Hotel - HRBMS
// Session-based authentication & authorization
// ============================================================

// Middleware to check if user is authenticated (logged in)
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }
    next();
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }

    if (req.session.user.Role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Middleware to check if user has admin or manager role
const requireAdminOrManager = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }

    const role = req.session.user.Role;
    if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Manager or Admin privileges required.'
        });
    }
    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireAdminOrManager
};
