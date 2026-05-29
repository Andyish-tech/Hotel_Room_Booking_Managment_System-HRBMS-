// ============================================================
// User Controller
// Golden Stay Hotel - HRBMS
// Operations: INSERT, DELETE, UPDATE, RETRIEVE (as per requirements)
// Password encryption using bcryptjs
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../Config/db');

// Insert a new user (with encrypted password)
const createUser = async (req, res) => {
    try {
        const { FullName, Username, Email, Role, Password } = req.body;

        // Validate required fields
        if (!FullName || !Username || !Password) {
            return res.status(400).json({
                success: false,
                message: 'FullName, Username, and Password are required'
            });
        }

        // FullName must not contain numbers
        if (/[0-9]/.test(FullName)) {
            return res.status(400).json({
                success: false,
                message: 'FullName cannot contain numbers'
            });
        }

        // FullName should only contain letters, spaces, hyphens, apostrophes, periods
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿŒœŠšŽž\s\-'.]+$/.test(FullName.trim())) {
            return res.status(400).json({
                success: false,
                message: 'FullName contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.'
            });
        }

        // Validate email format if provided
        if (Email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address with an @ symbol'
                });
            }
        }

        // Strong password validation (per requirement: password must be strong)
        const passwordErrors = [];
        if (Password.length < 8) {
            passwordErrors.push('at least 8 characters');
        }
        if (!/[A-Z]/.test(Password)) {
            passwordErrors.push('an uppercase letter');
        }
        if (!/[a-z]/.test(Password)) {
            passwordErrors.push('a lowercase letter');
        }
        if (!/[0-9]/.test(Password)) {
            passwordErrors.push('a number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(Password)) {
            passwordErrors.push('a special character (!@#$%^&* etc.)');
        }

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain ' + passwordErrors.join(', ')
            });
        }

        // Check if username already exists
        const [existing] = await pool.query(
            'SELECT * FROM User WHERE Username = ?',
            [Username]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        if (Email) {
            const [emailExists] = await pool.query(
                'SELECT * FROM User WHERE Email = ?',
                [Email]
            );
            if (emailExists.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Encrypt the password with bcrypt (salt rounds = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        // Managers can only create staff users
        let userRole = Role || 'staff';
        if (req.session.user.Role === 'manager') {
            userRole = 'staff';
        }

        const [result] = await pool.query(
            'INSERT INTO User (FullName, Username, Email, Role, Password) VALUES (?, ?, ?, ?, ?)',
            [FullName, Username, Email, userRole, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                UserID: result.insertId,
                FullName,
                Username,
                Email,
                Role: userRole
            }
        });
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// Retrieve all users
const getAllUsers = async (req, res) => {
    try {
        // Don't return passwords
        const [users] = await pool.query(
            'SELECT UserID, FullName, Username, Email, Role FROM User ORDER BY UserID DESC'
        );

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: error.message
        });
    }
};

// Retrieve a single user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query(
            'SELECT UserID, FullName, Username, Email, Role FROM User WHERE UserID = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
            error: error.message
        });
    }
};

// Update a user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { FullName, Username, Email, Role, Password } = req.body;

        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM User WHERE UserID = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];

        if (FullName) {
            // FullName must not contain numbers
            if (/[0-9]/.test(FullName)) {
                return res.status(400).json({
                    success: false,
                    message: 'FullName cannot contain numbers'
                });
            }
            if (!/^[A-Za-zÀ-ÖØ-öø-ÿŒœŠšŽž\s\-'.]+$/.test(FullName.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'FullName contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.'
                });
            }
            updateFields.push('FullName = ?');
            updateValues.push(FullName);
        }
        if (Username) {
            updateFields.push('Username = ?');
            updateValues.push(Username);
        }
        if (Email !== undefined) {
            // Validate email format if provided
            if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address with an @ symbol'
                });
            }
            updateFields.push('Email = ?');
            updateValues.push(Email);
        }
        if (Role) {
            updateFields.push('Role = ?');
            updateValues.push(Role);
        }
        if (Password) {
            // Strong password validation
            const passwordErrors = [];
            if (Password.length < 8) passwordErrors.push('at least 8 characters');
            if (!/[A-Z]/.test(Password)) passwordErrors.push('an uppercase letter');
            if (!/[a-z]/.test(Password)) passwordErrors.push('a lowercase letter');
            if (!/[0-9]/.test(Password)) passwordErrors.push('a number');
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(Password)) passwordErrors.push('a special character (!@#$%^&* etc.)');

            if (passwordErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain ' + passwordErrors.join(', ')
                });
            }

            // Encrypt the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password, salt);
            updateFields.push('Password = ?');
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        await pool.query(
            `UPDATE User SET ${updateFields.join(', ')} WHERE UserID = ?`,
            updateValues
        );

        res.status(200).json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
};

// Delete a user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM User WHERE UserID = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete security questions first (foreign key constraint)
        await pool.query('DELETE FROM Security WHERE UserId = ?', [id]);

        // Release user reference from bookings (UserID is nullable)
        await pool.query('UPDATE Booking SET UserID = NULL WHERE UserID = ?', [id]);

        // Delete the user
        await pool.query('DELETE FROM User WHERE UserID = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};
