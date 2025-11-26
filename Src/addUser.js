const db = require('./db'); 
const bcrypt = require('bcryptjs');

const [,, username, password, role = 'user'] = process.argv;

if (!username || !password) {
  console.error('Usage: node Src/addUser.js <username> <password> [role]');
  process.exit(1);
}

bcrypt.hash(password, 10)
  .then(hash => {
    db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role],
      (err, result) => {
        if (err) {
          console.error('DB error:', err.message);
          process.exit(1);
        }
        console.log('User created with id', result.insertId);
        process.exit(0);
      }
    );
  })
  .catch(e => {
    console.error('Hash error:', e.message);
    process.exit(1);
  });