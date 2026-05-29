// ============================================================
// Golden Stay Hotel - HRBMS Backend Server
// Hotel Room Booking Management System
// ============================================================

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Middleware Configuration
// ============================================================

// CORS - Allow frontend requests
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session-based authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'GoldenStayHotelSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ============================================================
// Import Routes
// ============================================================

const authRoutes = require('./Routes/authRoutes');
const roomRoutes = require('./Routes/roomRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const bookingRoutes = require('./Routes/bookingRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const userRoutes = require('./Routes/userRoutes');
const securityRoutes = require('./Routes/securityRoutes');

// ============================================================
// Route Middleware
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/security', securityRoutes);

// ============================================================
// Health Check Endpoint
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Golden Stay Hotel HRBMS Server is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// Error Handling Middleware
// ============================================================

app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
    console.log('============================================');
    console.log('  Golden Stay Hotel - HRBMS Server');
    console.log(`  Running on port ${PORT}`);
    console.log('  Environment:', process.env.NODE_ENV || 'development');
    console.log('============================================');
});
