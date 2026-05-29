// ============================================================
// Payment Routes
// Golden Stay Hotel - HRBMS
// Operations: INSERT only (as per requirements)
// ============================================================

const express = require('express');
const router = express.Router();
const { createPayment, getAllPayments, getBillByBookingId, getDailyReport } = require('../Controller/paymentController');
const { requireAuth } = require('../Middleware/authMiddleware');

// All payment routes require authentication
router.use(requireAuth);

// POST /api/payments - Record a new payment (INSERT)
router.post('/', createPayment);

// GET /api/payments - Get all payments (for reports)
router.get('/', getAllPayments);

// GET /api/payments/bill/:bookingId - Generate bill for a booking
router.get('/bill/:bookingId', getBillByBookingId);

// GET /api/payments/report/daily - Get daily payment report
router.get('/report/daily', getDailyReport);

module.exports = router;
