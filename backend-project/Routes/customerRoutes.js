// ============================================================
// Customer Routes
// Golden Stay Hotel - HRBMS
// ============================================================

const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers } = require('../Controller/customerController');
const { requireAuth } = require('../Middleware/authMiddleware');

// All customer routes require authentication
router.use(requireAuth);

// POST /api/customers - Create a new customer (INSERT)
router.post('/', createCustomer);

// GET /api/customers - Get all customers
router.get('/', getAllCustomers);

module.exports = router;
