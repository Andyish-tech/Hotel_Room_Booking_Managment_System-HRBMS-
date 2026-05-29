// ============================================================
// User Routes
// Golden Stay Hotel - HRBMS
// Full CRUD: INSERT, DELETE, UPDATE, RETRIEVE (as per requirements)
// ============================================================

const express = require('express');
const router = express.Router();
const { 
    createUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} = require('../Controller/userController');
const { requireAuth, requireAdmin, requireAdminOrManager } = require('../Middleware/authMiddleware');

// All user management routes require authentication
router.use(requireAuth);

// POST /api/users - Create a new user (INSERT) — Admin & Manager
router.post('/', requireAdminOrManager, createUser);

// GET /api/users - Get all users (RETRIEVE) — Admin & Manager
router.get('/', requireAdminOrManager, getAllUsers);

// GET /api/users/:id - Get a single user (RETRIEVE) — Admin & Manager
router.get('/:id', requireAdminOrManager, getUserById);

// PUT /api/users/:id - Update a user (UPDATE) — Admin only
router.put('/:id', requireAdmin, updateUser);

// DELETE /api/users/:id - Delete a user (DELETE) — Admin only
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;
