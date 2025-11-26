// Konfigurasi koneksi database MySQL
const mysql = require('mysql2');

// Baca konfigurasi dari environment variables agar mudah di-deploy
// Contoh env vars yang digunakan: DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'legal_project',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Koneksi ke database gagal:', err.message || err);
    } else {
        console.log('Terkoneksi ke database MySQL!');
        if (connection) connection.release();
    }
});

module.exports = db;
