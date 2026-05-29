// ============================================================
// Booking Routes
// Golden Stay Hotel - HRBMS
// Full CRUD: INSERT, DELETE, UPDATE, RETRIEVE (as per requirements)
// ============================================================

const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getAllBookings, 
    getBookingById, 
    updateBooking, 
    deleteBooking 
} = require('../Controller/bookingController');
const { requireAuth } = require('../Middleware/authMiddleware');

// All booking routes require authentication
router.use(requireAuth);

// POST /api/bookings - Create a new booking (INSERT)
router.post('/', createBooking);

// GET /api/bookings - Get all bookings (RETRIEVE)
router.get('/', getAllBookings);

// GET /api/bookings/:id - Get a single booking (RETRIEVE)
router.get('/:id', getBookingById);

// PUT /api/bookings/:id - Update a booking (UPDATE)
router.put('/:id', updateBooking);

// DELETE /api/bookings/:id - Delete a booking (DELETE)
router.delete('/:id', deleteBooking);

module.exports = router;
