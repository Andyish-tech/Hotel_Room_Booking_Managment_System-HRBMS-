// ============================================================
// Payment Controller
// Golden Stay Hotel - HRBMS
// Operations: INSERT only (as per requirements)
// ============================================================

const { pool } = require('../Config/db');

// Insert a new payment
const createPayment = async (req, res) => {
    try {
        const { AmountPaid, PaymentDate, BookingID } = req.body;

        // Validate required fields
        if (!AmountPaid || !PaymentDate || !BookingID) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: AmountPaid, PaymentDate, BookingID'
            });
        }

        // Check if booking exists
        const [booking] = await pool.query(
            'SELECT * FROM Booking WHERE BookingID = ?',
            [BookingID]
        );

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO Payment (AmountPaid, PaymentDate, BookingID) VALUES (?, ?, ?)',
            [AmountPaid, PaymentDate, BookingID]
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: {
                PaymentID: result.insertId,
                AmountPaid,
                PaymentDate,
                BookingID
            }
        });
    } catch (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record payment',
            error: error.message
        });
    }
};

// Retrieve all payments (for display/report purposes)
const getAllPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(
            `SELECT p.PaymentID, p.AmountPaid, p.PaymentDate,
                    p.BookingID, b.CheckInDate, b.CheckOutDate,
                    c.FullName AS CustomerName, c.PhoneNumber,
                    r.RoomNumber, r.RoomType
             FROM Payment p
             JOIN Booking b ON p.BookingID = b.BookingID
             JOIN Customer c ON b.CustomerID = c.CustomerID
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             ORDER BY p.PaymentDate DESC`
        );

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Get Payments Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payments',
            error: error.message
        });
    }
};

// Get bill for a specific booking (auto-calculates at 25,000 RWF/day)
const getBillByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [bookings] = await pool.query(
            `SELECT b.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                    c.FullName AS CustomerName, c.PhoneNumber,
                    r.RoomNumber, r.RoomType
             FROM Booking b
             JOIN Customer c ON b.CustomerID = c.CustomerID
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             WHERE b.BookingID = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];
        const ratePerDay = 25000;
        const totalAmount = booking.NumberOfDays * ratePerDay;

        // Get payment records for this booking (if any)
        const [payments] = await pool.query(
            'SELECT * FROM Payment WHERE BookingID = ? ORDER BY PaymentDate DESC',
            [bookingId]
        );

        const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.AmountPaid || 0), 0);
        const remainingBalance = totalAmount - amountPaid;

        res.status(200).json({
            success: true,
            data: {
                booking: {
                    BookingID: booking.BookingID,
                    CustomerName: booking.CustomerName,
                    PhoneNumber: booking.PhoneNumber,
                    RoomNumber: booking.RoomNumber,
                    RoomType: booking.RoomType,
                    CheckInDate: booking.CheckInDate,
                    CheckOutDate: booking.CheckOutDate,
                    NumberOfDays: booking.NumberOfDays,
                    RatePerDay: ratePerDay,
                    TotalAmount: totalAmount,
                    AmountPaid: amountPaid,
                    RemainingBalance: remainingBalance
                },
                payments: payments.map(p => ({
                    PaymentID: p.PaymentID,
                    AmountPaid: p.AmountPaid,
                    PaymentDate: p.PaymentDate
                }))
            }
        });
    } catch (error) {
        console.error('Get Bill Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate bill',
            error: error.message
        });
    }
};

// Get daily payment report (supports single date or date range)
const getDailyReport = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;
        let query;
        let params;

        if (startDate && endDate) {
            // Date range mode
            query = `SELECT p.PaymentID, p.AmountPaid, p.PaymentDate,
                    p.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                    c.FullName AS CustomerName, c.PhoneNumber,
                    r.RoomNumber, r.RoomType
             FROM Payment p
             JOIN Booking b ON p.BookingID = b.BookingID
             JOIN Customer c ON b.CustomerID = c.CustomerID
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             WHERE p.PaymentDate BETWEEN ? AND ?
             ORDER BY p.PaymentDate ASC, p.PaymentID ASC`;
            params = [startDate, endDate];
        } else {
            // Single date mode
            const reportDate = date || new Date().toISOString().split('T')[0];
            query = `SELECT p.PaymentID, p.AmountPaid, p.PaymentDate,
                    p.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                    c.FullName AS CustomerName, c.PhoneNumber,
                    r.RoomNumber, r.RoomType
             FROM Payment p
             JOIN Booking b ON p.BookingID = b.BookingID
             JOIN Customer c ON b.CustomerID = c.CustomerID
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             WHERE p.PaymentDate = ?
             ORDER BY p.PaymentID ASC`;
            params = [reportDate];
        }

        const [payments] = await pool.query(query, params);

        const totalAmount = payments.reduce(
            (sum, p) => sum + parseFloat(p.AmountPaid || 0),
            0
        );

        const label = startDate && endDate
            ? `${startDate} to ${endDate}`
            : (date || new Date().toISOString().split('T')[0]);

        res.status(200).json({
            success: true,
            data: {
                reportDate: label,
                startDate: startDate || null,
                endDate: endDate || null,
                totalPayments: payments.length,
                totalAmount,
                payments
            }
        });
    } catch (error) {
        console.error('Get Daily Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate daily report',
            error: error.message
        });
    }
};

module.exports = {
    createPayment,
    getAllPayments,
    getBillByBookingId,
    getDailyReport
};
