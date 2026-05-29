-- ============================================================
-- HRBMS Database Seed Data (Reference Only)
-- Golden Stay Hotel - Hotel Room Booking Management System
-- ============================================================
--
-- NOTE: Use seed.js (backend-project/seed.js) instead of this SQL file.
-- The seed.js script handles everything including bcrypt password hashing,
-- inserts all 5 users, rooms, customers, bookings, and payments.
--
-- Run:   cd backend-project && node seed.js
--
-- This SQL file is kept for reference / manual inspection only.
-- ============================================================

USE HRBMS;

-- ============================================================
-- Insert Sample Rooms
-- ============================================================
INSERT INTO Room (RoomNumber, RoomType, RoomStatus) VALUES
('101', 'Standard Single', 'Available'),
('102', 'Standard Single', 'Available'),
('103', 'Standard Single', 'Occupied'),
('201', 'Standard Double', 'Available'),
('202', 'Standard Double', 'Available'),
('203', 'Standard Double', 'Reserved'),
('301', 'Deluxe Single', 'Available'),
('302', 'Deluxe Single', 'Occupied'),
('401', 'Deluxe Double', 'Available'),
('402', 'Deluxe Double', 'Available'),
('501', 'Suite', 'Available'),
('502', 'Suite', 'Occupied'),
('503', 'Suite', 'Under Maintenance'),
('601', 'Presidential Suite', 'Available');

-- ============================================================
-- Insert Sample Customers
-- ============================================================
INSERT INTO Customer (FullName, PhoneNumber) VALUES
('Jean Baptiste Habimana', '+250788100001'),
('Alice Mukamana', '+250788100002'),
('David Niyonzima', '+250788100003'),
('Grace Uwimana', '+250788100004'),
('Pierre Ndagijimana', '+250788100005'),
('Claudine Ingabire', '+250788100006'),
('Emmanuel Mugisha', '+250788100007'),
('Jeanne d''Arc Mukeshimana', '+250788100008'),
('Olivier Nkunda', '+250788100009'),
('Sandrine Uwase', '+250788100010'),
('Patrick Habiyambere', '+250788100011'),
('Diane Nyiraneza', '+250788100012'),
('Fidele Bimenyimana', '+250788100013'),
('Angelique Mukandekezi', '+250788100014'),
('Bonaventure Niyibizi', '+250788100015');
