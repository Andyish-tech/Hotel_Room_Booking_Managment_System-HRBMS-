// ============================================================
// HRBMS Database Seed Script
// Golden Stay Hotel - Hotel Room Booking Management System
// ============================================================
// Run with: node seed.js
// This will:
//   1. Create 5 users with password "Admin@123" (bcrypt-hashed)
//   2. Insert sample rooms, customers, bookings, and payments
// ============================================================

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'HRBMS',
};

async function seed() {
    let connection;
    try {
        console.log('🔌 Connecting to HRBMS database...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected successfully.\n');

        // Start transaction — ensures atomicity: all or nothing
        await connection.beginTransaction();

        // ============================================================
        // STEP 1: Hash the common password
        // ============================================================
        console.log('🔐 Hashing password "Admin@123"...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);
        console.log('✅ Password hashed.\n');

        // ============================================================
        // STEP 2: Clear existing data (respecting FK order)
        // ============================================================
        console.log('🧹 Clearing existing data...');
        await connection.execute('DELETE FROM Security');
        await connection.execute('DELETE FROM Payment');
        await connection.execute('DELETE FROM Booking');
        await connection.execute('DELETE FROM User');
        await connection.execute('DELETE FROM Customer');
        await connection.execute('DELETE FROM Room');
        console.log('✅ Existing data cleared.\n');

        // ============================================================
        // STEP 3: Create 5 Users
        // ============================================================
        console.log('👤 Creating 5 users...');

        const users = [
            {
                FullName: 'System Administrator',
                Username: 'admin',
                Email: 'admin@GoldenStayHotel.com',
                Role: 'admin',
            },
            {
                FullName: 'Jean Pierre Manirafasha',
                Username: 'manager',
                Email: 'manager@GoldenStayHotel.com',
                Role: 'manager',
            },
            {
                FullName: 'Alice Mukamana',
                Username: 'alice',
                Email: 'alice@GoldenStayHotel.com',
                Role: 'staff',
            },
            {
                FullName: 'David Niyonzima',
                Username: 'david',
                Email: 'david@GoldenStayHotel.com',
                Role: 'staff',
            },
            {
                FullName: 'Grace Uwimana',
                Username: 'grace',
                Email: 'grace@GoldenStayHotel.com',
                Role: 'staff',
            },
        ];

        for (const user of users) {
            await connection.execute(
                'INSERT INTO User (FullName, Username, Email, Role, Password) VALUES (?, ?, ?, ?, ?)',
                [user.FullName, user.Username, user.Email, user.Role, hashedPassword]
            );
            console.log(`   ✅ ${user.Username} (${user.Role}) — Password: Admin@123`);
        }

        // ============================================================
        // STEP 4: Insert Sample Rooms
        // ============================================================
        console.log('\n🏠 Creating sample rooms...');
        const rooms = [
            ['101', 'Standard Single', 'Available'],
            ['102', 'Standard Single', 'Available'],
            ['103', 'Standard Single', 'Occupied'],
            ['201', 'Standard Double', 'Available'],
            ['202', 'Standard Double', 'Available'],
            ['203', 'Standard Double', 'Reserved'],
            ['301', 'Deluxe Single', 'Available'],
            ['302', 'Deluxe Single', 'Occupied'],
            ['401', 'Deluxe Double', 'Available'],
            ['402', 'Deluxe Double', 'Available'],
            ['501', 'Suite', 'Available'],
            ['502', 'Suite', 'Occupied'],
            ['503', 'Suite', 'Under Maintenance'],
            ['601', 'Presidential Suite', 'Available'],
        ];

        for (const [roomNumber, roomType, roomStatus] of rooms) {
            await connection.execute(
                'INSERT INTO Room (RoomNumber, RoomType, RoomStatus) VALUES (?, ?, ?)',
                [roomNumber, roomType, roomStatus]
            );
        }
        console.log(`   ✅ ${rooms.length} rooms created.`);

        // ============================================================
        // STEP 5: Insert Sample Customers
        // ============================================================
        console.log('\n👥 Creating sample customers...');
        const customers = [
            ['Jean Baptiste Habimana', '+250788100001'],
            ['Alice Mukamana', '+250788100002'],
            ['David Niyonzima', '+250788100003'],
            ['Grace Uwimana', '+250788100004'],
            ['Pierre Ndagijimana', '+250788100005'],
            ['Claudine Ingabire', '+250788100006'],
            ['Emmanuel Mugisha', '+250788100007'],
            ["Jeanne d'Arc Mukeshimana", '+250788100008'],
            ['Olivier Nkunda', '+250788100009'],
            ['Sandrine Uwase', '+250788100010'],
            ['Patrick Habiyambere', '+250788100011'],
            ['Diane Nyiraneza', '+250788100012'],
            ['Fidele Bimenyimana', '+250788100013'],
            ['Angelique Mukandekezi', '+250788100014'],
            ['Bonaventure Niyibizi', '+250788100015'],
        ];

        for (const [fullName, phoneNumber] of customers) {
            await connection.execute(
                'INSERT INTO Customer (FullName, PhoneNumber) VALUES (?, ?)',
                [fullName, phoneNumber]
            );
        }
        console.log(`   ✅ ${customers.length} customers created.`);

        // ============================================================
        // STEP 6: Insert Sample Bookings
        // ============================================================
        console.log('\n📅 Creating sample bookings...');
        const bookings = [
            { roomNo: '103', custId: 1, checkIn: '2026-05-25', checkOut: '2026-05-28', days: 3, userId: 1 },
            { roomNo: '302', custId: 2, checkIn: '2026-05-26', checkOut: '2026-05-30', days: 4, userId: 3 },
            { roomNo: '203', custId: 3, checkIn: '2026-05-27', checkOut: '2026-05-29', days: 2, userId: 3 },
            { roomNo: '502', custId: 4, checkIn: '2026-05-28', checkOut: '2026-06-01', days: 4, userId: 4 },
            { roomNo: '103', custId: 5, checkIn: '2026-05-20', checkOut: '2026-05-22', days: 2, userId: 3 },
            { roomNo: '302', custId: 6, checkIn: '2026-05-15', checkOut: '2026-05-18', days: 3, userId: 4 },
            { roomNo: '502', custId: 7, checkIn: '2026-05-10', checkOut: '2026-05-14', days: 4, userId: 5 },
        ];

        for (const b of bookings) {
            await connection.execute(
                'INSERT INTO Booking (CheckInDate, CheckOutDate, NumberOfDays, RoomNumber, CustomerID, UserID) VALUES (?, ?, ?, ?, ?, ?)',
                [b.checkIn, b.checkOut, b.days, b.roomNo, b.custId, b.userId]
            );
        }
        console.log(`   ✅ ${bookings.length} bookings created.`);

        // ============================================================
        // STEP 7: Insert Sample Payments (25,000 Frw per day)
        // ============================================================
        console.log('\n💰 Creating sample payments...');
        const payments = [
            { bookingId: 1, amount: 75000, date: '2026-05-28' },   // 3 days × 25,000
            { bookingId: 2, amount: 100000, date: '2026-05-30' },  // 4 days × 25,000
            { bookingId: 3, amount: 50000, date: '2026-05-29' },   // 2 days × 25,000
            { bookingId: 4, amount: 100000, date: '2026-06-01' },  // 4 days × 25,000
            { bookingId: 5, amount: 50000, date: '2026-05-22' },   // 2 days × 25,000
            { bookingId: 6, amount: 75000, date: '2026-05-18' },   // 3 days × 25,000
            { bookingId: 7, amount: 100000, date: '2026-05-14' },  // 4 days × 25,000
        ];

        for (const p of payments) {
            await connection.execute(
                'INSERT INTO Payment (AmountPaid, PaymentDate, BookingID) VALUES (?, ?, ?)',
                [p.amount, p.date, p.bookingId]
            );
        }
        console.log(`   ✅ ${payments.length} payments created.\n`);

        // ============================================================
        // Commit transaction
        // ============================================================
        await connection.commit();

        // ============================================================
        // SUMMARY
        // ============================================================
        console.log('═══════════════════════════════════════════');
        console.log('  ✅ SEED COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log('');
        console.log('  Users:');
        console.log('  ───────────────────────────────────');
        console.log('  Username    | Role      | Password');
        console.log('  ───────────────────────────────────');
        console.log('  admin       | admin     | Admin@123');
        console.log('  manager     | manager   | Admin@123');
        console.log('  alice       | staff     | Admin@123');
        console.log('  david       | staff     | Admin@123');
        console.log('  grace       | staff     | Admin@123');
        console.log('  ───────────────────────────────────');
        console.log('');
        console.log(`  🏠 ${rooms.length} rooms created`);
        console.log(`  👥 ${customers.length} customers created`);
        console.log(`  📅 ${bookings.length} bookings created`);
        console.log(`  💰 ${payments.length} payments created`);
        console.log('');

    } catch (error) {
        // Rollback on any error
        if (connection) {
            try {
                await connection.rollback();
                console.log('⏪ Transaction rolled back.');
            } catch (rollbackError) {
                console.error('⚠️  Rollback failed:', rollbackError.message);
            }
        }
        console.error('\n❌ Seed failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed.');
        }
    }
}

seed();
