// ============================================================
// Database Connection Configuration
// Golden Stay Hotel - HRBMS
// ============================================================

const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create a connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'HRBMS',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

// Test the database connection
const testConnection = async () => {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
        console.log('  Database: Connected to HRBMS successfully');
        return true;
    } catch (error) {
        console.error('  Database Connection Error:', error.message);
        console.error('  Please ensure MySQL is running and HRBMS database exists');
        return false;
    }
};

module.exports = {
    pool: promisePool,
    testConnection
};
