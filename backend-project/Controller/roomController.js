// ============================================================
// Room Controller
// Golden Stay Hotel - HRBMS
// Operations: INSERT only (as per requirements)
// ============================================================

const { pool } = require('../Config/db');

// Insert a new room
const createRoom = async (req, res) => {
    try {
        const { RoomNumber, RoomType, RoomStatus } = req.body;

        // Validate required fields
        if (!RoomNumber || !RoomType) {
            return res.status(400).json({
                success: false,
                message: 'RoomNumber and RoomType are required'
            });
        }

        // Check if room already exists
        const [existing] = await pool.query(
            'SELECT * FROM Room WHERE RoomNumber = ?',
            [RoomNumber]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room with this number already exists'
            });
        }

        const status = RoomStatus || 'Available';

        await pool.query(
            'INSERT INTO Room (RoomNumber, RoomType, RoomStatus) VALUES (?, ?, ?)',
            [RoomNumber, RoomType, status]
        );

        res.status(201).json({
            success: true,
            message: 'Room added successfully',
            data: { RoomNumber, RoomType, RoomStatus: status }
        });
    } catch (error) {
        console.error('Create Room Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add room',
            error: error.message
        });
    }
};

// Retrieve all rooms (needed for dropdowns and display)
const getAllRooms = async (req, res) => {
    try {
        const [rooms] = await pool.query(
            'SELECT * FROM Room ORDER BY RoomNumber'
        );

        res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Get Rooms Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve rooms',
            error: error.message
        });
    }
};

// Get available rooms
const getAvailableRooms = async (req, res) => {
    try {
        const [rooms] = await pool.query(
            "SELECT * FROM Room WHERE RoomStatus = 'Available' ORDER BY RoomNumber"
        );

        res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Get Available Rooms Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve available rooms',
            error: error.message
        });
    }
};

module.exports = {
    createRoom,
    getAllRooms,
    getAvailableRooms
};
