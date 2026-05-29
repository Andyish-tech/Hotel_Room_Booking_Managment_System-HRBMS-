// ============================================================
// Authentication Routes
// Golden Stay Hotel - HRBMS
// ============================================================

const express = require('express');
const router = express.Router();
const { login, logout, checkSession } = require('../Controller/authController');
const { requireAuth } = require('../Middleware/authMiddleware');

// POST /api/auth/login - User login
router.post('/login', login);

// POST /api/auth/logout - User logout (requires authentication)
router.post('/logout', requireAuth, logout);

// GET /api/auth/session - Check current session status
router.get('/session', checkSession);

module.exports = router;
