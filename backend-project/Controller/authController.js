// ============================================================
// Authentication Controller
// Golden Stay Hotel - HRBMS
// Session-based login with encrypted password verification
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../Config/db');

// Login - authenticate user with username and password
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username
        const [users] = await pool.query(
            'SELECT * FROM User WHERE Username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        // Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.Password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Create session
        req.session.user = {
            UserID: user.UserID,
            FullName: user.FullName,
            Username: user.Username,
            Email: user.Email,
            Role: user.Role
        };

        // Save session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create session'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: req.session.user
                }
            });
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Logout - destroy session
const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to logout'
                });
            }

            res.clearCookie('connect.sid');
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

// Check session status
const checkSession = async (req, res) => {
    try {
        if (req.session && req.session.user) {
            res.status(200).json({
                success: true,
                authenticated: true,
                data: {
                    user: req.session.user
                }
            });
        } else {
            res.status(200).json({
                success: true,
                authenticated: false,
                data: null
            });
        }
    } catch (error) {
        console.error('Check Session Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check session',
            error: error.message
        });
    }
};

module.exports = {
    login,
    logout,
    checkSession
};
