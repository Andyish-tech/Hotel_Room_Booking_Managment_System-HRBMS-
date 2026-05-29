// ============================================================
// Customer Controller
// Golden Stay Hotel - HRBMS
// Operations: INSERT only (as per requirements)
// ============================================================

const { pool } = require('../Config/db');

// Insert a new customer
const createCustomer = async (req, res) => {
    try {
        const { FullName, PhoneNumber } = req.body;

        // Validate required fields
        if (!FullName) {
            return res.status(400).json({
                success: false,
                message: 'FullName is required'
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

        if (!PhoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'PhoneNumber is required'
            });
        }

        // Validate phone number format (contains only digits, spaces, +, -, parentheses)
        if (!/^[\d\s\-+()]+$/.test(PhoneNumber.trim())) {
            return res.status(400).json({
                success: false,
                message: 'PhoneNumber contains invalid characters'
            });
        }

        const phoneDigits = PhoneNumber.replace(/\D/g, '');
        if (phoneDigits.length < 8 || phoneDigits.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'PhoneNumber must have between 8 and 15 digits'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO Customer (FullName, PhoneNumber) VALUES (?, ?)',
            [FullName, PhoneNumber]
        );

        res.status(201).json({
            success: true,
            message: 'Customer added successfully',
            data: {
                CustomerID: result.insertId,
                FullName,
                PhoneNumber
            }
        });
    } catch (error) {
        console.error('Create Customer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add customer',
            error: error.message
        });
    }
};

// Retrieve all customers (needed for dropdowns and display)
const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(
            'SELECT * FROM Customer ORDER BY CustomerID DESC'
        );

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Get Customers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve customers',
            error: error.message
        });
    }
};

module.exports = {
    createCustomer,
    getAllCustomers
};
