-- ============================================================
-- Golden Stay Hotel - HRBMS Database Schema
-- Hotel Room Booking Management System
-- ============================================================

CREATE DATABASE IF NOT EXISTS HRBMS;
USE HRBMS;

-- ============================================================
-- 1. Room Table
-- Stores information about hotel rooms
-- ============================================================
CREATE TABLE Room (
    RoomNumber VARCHAR(10) PRIMARY KEY,
    RoomType VARCHAR(50) NOT NULL,
    RoomStatus VARCHAR(20) NOT NULL DEFAULT 'Available',
    CHECK (RoomStatus IN ('Available', 'Occupied', 'Under Maintenance', 'Reserved'))
);

-- ============================================================
-- 2. Customer Table
-- Stores customer/client information
-- ============================================================
CREATE TABLE Customer (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL
);

-- ============================================================
-- 3. User Table
-- Stores system user accounts (staff/admin)
-- Password is stored encrypted using bcrypt
-- ============================================================
CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE,
    Role VARCHAR(20) NOT NULL DEFAULT 'staff',
    Password VARCHAR(255) NOT NULL,
    CHECK (Role IN ('admin', 'staff', 'manager'))
);

-- ============================================================
-- 4. Booking Table
-- Stores booking/reservation information
-- Relationships:
--   - Room (1) ---< (M) Booking: One room can have many bookings
--   - Customer (1) ---< (M) Booking: One customer can have many bookings
--   - User (1) ---< (M) Booking: One user can manage many bookings
-- ============================================================
CREATE TABLE Booking (
    BookingID INT PRIMARY KEY AUTO_INCREMENT,
    CheckInDate DATE NOT NULL,
    CheckOutDate DATE NOT NULL,
    NumberOfDays INT NOT NULL,
    RoomNumber VARCHAR(10) NOT NULL,
    CustomerID INT NOT NULL,
    UserID INT,
    FOREIGN KEY (RoomNumber) REFERENCES Room(RoomNumber)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (UserID) REFERENCES User(UserID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- 5. Payment Table
-- Stores payment records for bookings
-- Relationship:
--   - Booking (1) ---< (M) Payment: One booking can have multiple payments
-- ============================================================
CREATE TABLE Payment (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,
    AmountPaid DECIMAL(10, 2) NOT NULL,
    PaymentDate DATE NOT NULL,
    BookingID INT NOT NULL,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 6. Security Table
-- Stores security questions for password recovery
-- Relationship:
--   - User (1) ---< (M) Security: One user can have multiple security Q&A
-- ============================================================
CREATE TABLE Security (
    Sec_Id INT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    FOREIGN KEY (UserId) REFERENCES User(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- Note: To create the first admin user, start the backend server
-- and use POST /api/users endpoint (with admin privileges)
-- or register via the frontend UI.
--
-- Example credentials for testing:
--   Username: admin
--   Password: (create via backend registration)
--
-- The password is encrypted using bcryptjs before storage.
-- ============================================================
-- After starting the server, create your admin account through:
-- POST http://localhost:5000/api/users
-- Body: { "FullName": "System Admin", "Username": "admin",
--         "Email": "admin@GoldenStayHotel.com", "Role": "admin",
--         "Password": "Admin@123" }

-- ============================================================
-- Relationship Summary (Cardinalities):
-- ============================================================
-- Room (1) -----------< (M) Booking
--   One room can be booked multiple times across different dates
--   A booking must reference exactly one room
--
-- Customer (1) -------< (M) Booking
--   One customer can make multiple bookings
--   A booking must belong to exactly one customer
--
-- User (1) -----------< (M) Booking
--   One user (staff) can process multiple bookings
--   A booking must be processed by exactly one user
--
-- Booking (1) --------< (M) Payment
--   One booking can have multiple payments (partial payments)
--   A payment must belong to exactly one booking
--
-- User (1) -----------< (M) Security
--   One user can set up multiple security questions
--   A security record belongs to exactly one user
-- ============================================================
