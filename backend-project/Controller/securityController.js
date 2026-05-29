// ============================================================
// Security Controller
// Golden Stay Hotel - HRBMS
// Password recovery via security questions & answers
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../Config/db');

// ============================================================
// Set security questions for a user (authenticated)
// POST /api/security/questions
// ============================================================
const setSecurityQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        const userId = req.session?.user?.UserID;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one security question and answer is required'
            });
        }

        // Validate each question has both question and answer
        for (const q of questions) {
            if (!q.question || !q.answer) {
                return res.status(400).json({
                    success: false,
                    message: 'Each question must have both question and answer fields'
                });
            }
            if (q.question.length < 3 || q.answer.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Questions and answers must be at least 2-3 characters'
                });
            }
        }

        // Delete existing security questions for this user (replace all)
        await pool.query('DELETE FROM Security WHERE UserId = ?', [userId]);

        // Insert new security questions
        const insertValues = questions.map(q => [userId, q.question, q.answer.toLowerCase().trim()]);
        await pool.query(
            'INSERT INTO Security (UserId, question, answer) VALUES ?',
            [insertValues]
        );

        res.status(200).json({
            success: true,
            message: `Security questions saved successfully (${questions.length} question${questions.length > 1 ? 's' : ''})`,
            data: {
                count: questions.length
            }
        });
    } catch (error) {
        console.error('Set Security Questions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save security questions',
            error: error.message
        });
    }
};

// ============================================================
// Get security questions for the current user (authenticated)
// GET /api/security/questions
// Returns questions only (NOT answers) for display
// ============================================================
const getMySecurityQuestions = async (req, res) => {
    try {
        const userId = req.session?.user?.UserID;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const [questions] = await pool.query(
            'SELECT Sec_Id, question FROM Security WHERE UserId = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Get My Security Questions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve security questions',
            error: error.message
        });
    }
};

// ============================================================
// Get security questions for password recovery (unauthenticated)
// GET /api/security/recovery-questions?username=xxx
// Returns questions only (NOT answers)
// ============================================================
const getRecoveryQuestions = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Find the user
        const [users] = await pool.query(
            'SELECT UserID, FullName FROM User WHERE Username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with that username'
            });
        }

        const user = users[0];

        // Get their security questions (questions only, no answers)
        const [questions] = await pool.query(
            'SELECT Sec_Id, question FROM Security WHERE UserId = ?',
            [user.UserID]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No security questions set for this account. Contact an administrator.'
            });
        }

        res.status(200).json({
            success: true,
            message: `Verify your identity by answering your security question`,
            data: {
                userId: user.UserID,
                fullName: user.FullName,
                questions: questions.map(q => ({
                    secId: q.Sec_Id,
                    question: q.question
                }))
            }
        });
    } catch (error) {
        console.error('Get Recovery Questions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve recovery questions',
            error: error.message
        });
    }
};

// ============================================================
// Verify security answer (unauthenticated)
// POST /api/security/verify-answer
// Step 1: Verify the answer and return a reset token
// ============================================================
const verifySecurityAnswer = async (req, res) => {
    try {
        const { userId, secId, answer } = req.body;

        if (!userId || !secId || !answer) {
            return res.status(400).json({
                success: false,
                message: 'UserId, secId, and answer are required'
            });
        }

        // Get the stored security question and answer
        const [records] = await pool.query(
            'SELECT * FROM Security WHERE Sec_Id = ? AND UserId = ?',
            [secId, userId]
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Security question not found'
            });
        }

        const record = records[0];

        // Compare answer (case-insensitive comparison)
        const isAnswerCorrect = answer.toLowerCase().trim() === record.answer.toLowerCase().trim();

        if (!isAnswerCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect answer. Please try again.'
            });
        }

        // Generate a temporary reset token (simple approach: use userId + timestamp encrypted)
        // In production, use a proper JWT or crypto token
        const resetToken = Buffer.from(
            JSON.stringify({
                userId: userId,
                timestamp: Date.now(),
                verified: true
            })
        ).toString('base64');

        res.status(200).json({
            success: true,
            message: 'Answer verified successfully. You can now reset your password.',
            data: {
                resetToken,
                userId
            }
        });
    } catch (error) {
        console.error('Verify Security Answer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify answer',
            error: error.message
        });
    }
};

// ============================================================
// Reset password after security verification (unauthenticated)
// POST /api/security/reset-password
// Step 2: Use the reset token to set a new password
// ============================================================
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        // Strong password validation (must match user creation requirements)
        const passwordErrors = [];
        if (newPassword.length < 8) passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(newPassword)) passwordErrors.push('an uppercase letter');
        if (!/[a-z]/.test(newPassword)) passwordErrors.push('a lowercase letter');
        if (!/[0-9]/.test(newPassword)) passwordErrors.push('a number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) passwordErrors.push('a special character (!@#$%^&* etc.)');

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain ' + passwordErrors.join(', ')
            });
        }

        // Decode and verify the reset token
        let decoded;
        try {
            decoded = JSON.parse(Buffer.from(resetToken, 'base64').toString('utf-8'));
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Check if token is still valid (within 15 minutes)
        const tokenAge = Date.now() - decoded.timestamp;
        if (tokenAge > 15 * 60 * 1000) {
            return res.status(401).json({
                success: false,
                message: 'Reset token has expired. Please start the recovery process again.'
            });
        }

        if (!decoded.verified || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid reset token. Please start the recovery process again.'
            });
        }

        // Check if user exists
        const [users] = await pool.query(
            'SELECT * FROM User WHERE UserID = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Encrypt the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password
        await pool.query(
            'UPDATE User SET Password = ? WHERE UserID = ?',
            [hashedPassword, decoded.userId]
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session?.user?.UserID;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Strong password validation for new password
        const passwordErrors = [];
        if (newPassword.length < 8) passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(newPassword)) passwordErrors.push('an uppercase letter');
        if (!/[a-z]/.test(newPassword)) passwordErrors.push('a lowercase letter');
        if (!/[0-9]/.test(newPassword)) passwordErrors.push('a number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) passwordErrors.push('a special character (!@#$%^&* etc.)');

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'New password must contain ' + passwordErrors.join(', ')
            });
        }

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM User WHERE UserID = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Verify current password
        const isCurrentValid = await bcrypt.compare(currentPassword, user.Password);
        if (!isCurrentValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Make sure new password !== current password
        const isSamePassword = await bcrypt.compare(newPassword, user.Password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from your current password'
            });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE User SET Password = ? WHERE UserID = ?',
            [hashedPassword, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

module.exports = {
    setSecurityQuestions,
    getMySecurityQuestions,
    getRecoveryQuestions,
    verifySecurityAnswer,
    resetPassword,
    changePassword
};
