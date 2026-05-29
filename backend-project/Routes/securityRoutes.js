// ============================================================
// Security Routes
// Golden Stay Hotel - HRBMS
// Password recovery via security questions & answers
// ============================================================

const express = require('express');
const router = express.Router();
const {
    setSecurityQuestions,
    getMySecurityQuestions,
    getRecoveryQuestions,
    verifySecurityAnswer,
    resetPassword,
    changePassword
} = require('../Controller/securityController');
const { requireAuth } = require('../Middleware/authMiddleware');

// ============================================================
// Authenticated Routes (user must be logged in)
// ============================================================

// POST /api/security/questions - Set/manage security questions
router.post('/questions', requireAuth, setSecurityQuestions);

// GET /api/security/questions - Get my security questions (without answers)
router.get('/questions', requireAuth, getMySecurityQuestions);

// ============================================================
// Public Routes (no authentication required - for recovery)
// ============================================================

// GET /api/security/recovery-questions?username=xxx - Get questions for recovery
router.get('/recovery-questions', getRecoveryQuestions);

// POST /api/security/verify-answer - Verify security answer
router.post('/verify-answer', verifySecurityAnswer);

// POST /api/security/reset-password - Reset password after verification
router.post('/reset-password', resetPassword);

// PUT /api/security/change-password - Change password (authenticated)
router.put('/change-password', requireAuth, changePassword);

module.exports = router;
