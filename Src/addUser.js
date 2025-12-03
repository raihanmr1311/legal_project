const db = require('./db'); 
const bcrypt = require('bcryptjs');

 
const [,, username, password, perseroan = null, role = 'user'] = process.argv;

if (!username || !password) {
  console.error('Usage: node Src/addUser.js <username> <password> <perseroan> [role]');
  process.exit(1);
}

bcrypt.hash(password, 10)
  .then(hash => {
    
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
        
        sql = `INSERT INTO users (username, password, role, ${col}) VALUES (?, ?, ?, ?)`;
        params = [username, hash, role, perseroan || null];
      } else {
        
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