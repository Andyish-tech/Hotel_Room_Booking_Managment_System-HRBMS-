// ============================================================
// Room Routes
// Golden Stay Hotel - HRBMS
// ============================================================

const express = require('express');
const router = express.Router();
const { createRoom, getAllRooms, getAvailableRooms } = require('../Controller/roomController');
const { requireAuth } = require('../Middleware/authMiddleware');

// All room routes require authentication
router.use(requireAuth);

// POST /api/rooms - Create a new room (INSERT)
router.post('/', createRoom);

// GET /api/rooms - Get all rooms
router.get('/', getAllRooms);

// GET /api/rooms/available - Get available rooms only
router.get('/available', getAvailableRooms);

module.exports = router;
