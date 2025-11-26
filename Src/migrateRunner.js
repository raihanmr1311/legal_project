const fs = require('fs');
const mysql = require('mysql2');

const sql = fs.readFileSync(require('path').join(__dirname, '..', 'migrate.sql'), 'utf8');

const conn = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'legal_project',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
  multipleStatements: true
});

conn.connect(err => {
  if (err) {
    console.error('Koneksi gagal:', err.message || err);
    process.exit(1);
  }
  conn.query(sql, (e, r) => {
    if (e) {
      console.error('Migrasi gagal:', e.message || e);
      process.exit(1);
    }
    console.log('Migrasi berhasil.');
    conn.end();
    process.exit(0);
  });
});
