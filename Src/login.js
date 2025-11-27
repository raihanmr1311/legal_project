const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');

// POST /api/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username tidak ditemukan' });
        }
        const user = results[0];
        // Jika password sudah di-hash, gunakan bcrypt.compare
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            bcrypt.compare(password, user.password, (err, match) => {
                if (match) {
                    res.json({ success: true, role: user.role });
                } else {
                    res.status(401).json({ success: false, message: 'Password salah' });
                }
            });
        } else {
            if (user.password === password) {
                res.json({ success: true, role: user.role });
            } else {
                res.status(401).json({ success: false, message: 'Password salah' });
            }
        }
    });
});

module.exports = router;
