// ============================================================
// Booking Controller
// Golden Stay Hotel - HRBMS
// Operations: INSERT, DELETE, UPDATE, RETRIEVE (as per requirements)
// ============================================================

const { pool } = require('../Config/db');

// Insert a new booking
const createBooking = async (req, res) => {
    try {
        const { CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID } = req.body;
        const UserID = req.session?.user?.UserID;

        // Validate required fields
        if (!CheckInDate || !CheckOutDate || !NumberOfDays || !RoomNumber || !CustomerID) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID'
            });
        }

        // Validate check-in date is not in the past
        const checkIn = new Date(CheckInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        checkIn.setHours(0, 0, 0, 0);
        if (checkIn < today) {
            return res.status(400).json({
                success: false,
                message: 'Check-in date cannot be in the past. Must be today or a future date.'
            });
        }

        // Validate check-out is after check-in
        const checkOut = new Date(CheckOutDate);
        checkOut.setHours(0, 0, 0, 0);
        if (checkOut <= checkIn) {
            return res.status(400).json({
                success: false,
                message: 'Check-out date must be after check-in date'
            });
        }

        // Check if room exists and is available
        const [room] = await pool.query(
            'SELECT * FROM Room WHERE RoomNumber = ?',
            [RoomNumber]
        );

        if (room.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (room[0].RoomStatus !== 'Available') {
            return res.status(400).json({
                success: false,
                message: 'Room is not available for booking'
            });
        }

        // Check for date conflicts
        const [conflicts] = await pool.query(
            `SELECT * FROM Booking WHERE RoomNumber = ? AND 
             ((CheckInDate BETWEEN ? AND ?) OR 
              (CheckOutDate BETWEEN ? AND ?) OR 
              (? BETWEEN CheckInDate AND CheckOutDate))`,
            [RoomNumber, CheckInDate, CheckOutDate, CheckInDate, CheckOutDate, CheckInDate]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room is already booked for the selected dates'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO Booking (CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID, UserID) VALUES (?, ?, ?, ?, ?, ?)',
            [CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID, UserID]
        );

        // Update room status to 'Occupied'
        await pool.query(
            "UPDATE Room SET RoomStatus = 'Occupied' WHERE RoomNumber = ?",
            [RoomNumber]
        );

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                BookingID: result.insertId,
                CheckInDate,
                CheckOutDate,
                NumberOfDays,
                RoomNumber,
                CustomerID,
                UserID
            }
        });
    } catch (error) {
        console.error('Create Booking Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
};

// Retrieve all bookings with payment summary
const getAllBookings = async (req, res) => {
    try {
        const [bookings] = await pool.query(
            `SELECT b.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                    b.RoomNumber, r.RoomType, r.RoomStatus,
                    b.CustomerID, c.FullName AS CustomerName, c.PhoneNumber,
                    b.UserID, u.FullName AS ProcessedBy,
                    COALESCE(SUM(p.AmountPaid), 0) AS AmountPaid,
                    (b.NumberOfDays * 25000) AS TotalAmount,
                    ((b.NumberOfDays * 25000) - COALESCE(SUM(p.AmountPaid), 0)) AS RemainingBalance
             FROM Booking b
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             JOIN Customer c ON b.CustomerID = c.CustomerID
             LEFT JOIN User u ON b.UserID = u.UserID
             LEFT JOIN Payment p ON b.BookingID = p.BookingID
             GROUP BY b.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                      b.RoomNumber, r.RoomType, r.RoomStatus,
                      b.CustomerID, c.FullName, c.PhoneNumber,
                      b.UserID, u.FullName
             ORDER BY b.BookingID DESC`
        );

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Get Bookings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings',
            error: error.message
        });
    }
};

// Retrieve a single booking by ID with payment summary
const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        const [bookings] = await pool.query(
            `SELECT b.*, c.FullName AS CustomerName, c.PhoneNumber,
                    r.RoomType, r.RoomStatus, u.FullName AS ProcessedBy,
                    COALESCE(SUM(p.AmountPaid), 0) AS AmountPaid,
                    (b.NumberOfDays * 25000) AS TotalAmount,
                    ((b.NumberOfDays * 25000) - COALESCE(SUM(p.AmountPaid), 0)) AS RemainingBalance
             FROM Booking b
             JOIN Customer c ON b.CustomerID = c.CustomerID
             JOIN Room r ON b.RoomNumber = r.RoomNumber
             LEFT JOIN User u ON b.UserID = u.UserID
             LEFT JOIN Payment p ON b.BookingID = p.BookingID
             WHERE b.BookingID = ?
             GROUP BY b.BookingID, b.CheckInDate, b.CheckOutDate, b.NumberOfDays,
                      b.RoomNumber, b.CustomerID, b.UserID,
                      c.FullName, c.PhoneNumber,
                      r.RoomType, r.RoomStatus, u.FullName`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bookings[0]
        });
    } catch (error) {
        console.error('Get Booking Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve booking',
            error: error.message
        });
    }
};

// Update a booking
const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID } = req.body;

        // Check if booking exists
        const [existing] = await pool.query(
            'SELECT * FROM Booking WHERE BookingID = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const oldRoomNumber = existing[0].RoomNumber;

        // Validate check-in date is not in the past (for new dates)
        if (CheckInDate) {
            const checkIn = new Date(CheckInDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            checkIn.setHours(0, 0, 0, 0);
            if (checkIn < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-in date cannot be in the past. Must be today or a future date.'
                });
            }
        }

        // Validate check-out is after check-in
        if (CheckInDate && CheckOutDate) {
            const checkIn = new Date(CheckInDate);
            const checkOut = new Date(CheckOutDate);
            checkIn.setHours(0, 0, 0, 0);
            checkOut.setHours(0, 0, 0, 0);
            if (checkOut <= checkIn) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-out date must be after check-in date'
                });
            }
        }

        await pool.query(
            `UPDATE Booking SET 
             CheckInDate = ?, CheckOutDate = ?, NumberOfDays = ?, 
             RoomNumber = ?, CustomerID = ?
             WHERE BookingID = ?`,
            [CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID, id]
        );

        // If room changed, update old room status and new room status
        if (oldRoomNumber !== RoomNumber) {
            await pool.query(
                "UPDATE Room SET RoomStatus = 'Available' WHERE RoomNumber = ?",
                [oldRoomNumber]
            );
            await pool.query(
                "UPDATE Room SET RoomStatus = 'Occupied' WHERE RoomNumber = ?",
                [RoomNumber]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('Update Booking Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking',
            error: error.message
        });
    }
};

// Delete a booking
const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if booking exists
        const [existing] = await pool.query(
            'SELECT * FROM Booking WHERE BookingID = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Free up the room
        await pool.query(
            "UPDATE Room SET RoomStatus = 'Available' WHERE RoomNumber = ?",
            [existing[0].RoomNumber]
        );

        // Delete associated payments first (foreign key constraint)
        await pool.query('DELETE FROM Payment WHERE BookingID = ?', [id]);

        // Delete the booking
        await pool.query('DELETE FROM Booking WHERE BookingID = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete Booking Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete booking',
            error: error.message
        });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking
};
