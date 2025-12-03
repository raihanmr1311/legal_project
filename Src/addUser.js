const db = require('./db'); 
const bcrypt = require('bcryptjs');

// Usage: node Src/addUser.js <username> <password> <perseroanId|null> [role]
// perseroanId: numeric id of perseroan (recommended). If your `users` table still uses
// a text `perseroan` column, this script will still insert the provided value.
const [,, username, password, perseroan = null, role = 'user'] = process.argv;

if (!username || !password) {
  console.error('Usage: node Src/addUser.js <username> <password> <perseroan> [role]');
  process.exit(1);
}

bcrypt.hash(password, 10)
  .then(hash => {
    // Detect whether the users table has a `perseroan_id` or `perseroan` column
    const detectSql = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('perseroan_id','perseroan')
      ORDER BY FIELD(COLUMN_NAME,'perseroan','perseroan_id') DESC
      LIMIT 1
    `;

    db.query(detectSql, (detErr, detRows) => {
      if (detErr) {
        console.error('DB error while detecting columns:', detErr.message);
        process.exit(1);
      }

      const col = (detRows && detRows.length) ? detRows[0].COLUMN_NAME : null;
      let sql, params;

      if (col) {
        // Insert including the detected perseroan column (either perseroan or perseroan_id)
        sql = `INSERT INTO users (username, password, role, ${col}) VALUES (?, ?, ?, ?)`;
        params = [username, hash, role, perseroan || null];
      } else {
        // No perseroan-like column detected; fall back to inserting username/password/role only
        sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        params = [username, hash, role];
      }

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error('DB error:', err.message);
          process.exit(1);
        }
        console.log('User created with id', result.insertId);
        if (col) console.log(`Inserted into column: ${col}`);
        process.exit(0);
      });
    });
  })
  .catch(e => {
    console.error('Hash error:', e.message);
    process.exit(1);
  });