const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');

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

        const respondWithPerseroanId = (userObj) => {
            // Try to resolve perseroan_id: if users.perseroan already numeric, use it; otherwise lookup in perseroan table
            const raw = userObj.perseroan;
            if (raw && String(raw).match(/^\d+$/)) {
                const pid = Number(raw);
                return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: pid, userId: userObj.id });
            }
            db.query('SELECT id FROM perseroan WHERE perseroan = ? LIMIT 1', [raw || ''], (err2, rows2) => {
                if (err2) {
                    // still respond but without perseroan_id
                    return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: null, userId: userObj.id });
                }
                if (rows2 && rows2.length) return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: rows2[0].id, userId: userObj.id });
                return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: null, userId: userObj.id });
            });
        };

        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            bcrypt.compare(password, user.password, (err, match) => {
                if (match) {
                    return respondWithPerseroanId(user);
                } else {
                    return res.status(401).json({ success: false, message: 'Password salah' });
                }
            });
        } else {
            if (user.password === password) {
                return respondWithPerseroanId(user);
            } else {
                return res.status(401).json({ success: false, message: 'Password salah' });
            }
        }
    });
});

module.exports = router;

// Helper endpoint: return basic user info by id (used by client when localStorage lacks perseroan)
router.get('/user', (req, res) => {
    const id = req.query.id || req.query.userId;
    if (!id) return res.status(400).json({ success: false, message: 'Missing user id' });
    db.query('SELECT id, username, perseroan, role FROM users WHERE id = ? LIMIT 1', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error', error: err });
        if (!results || !results.length) return res.status(404).json({ success: false, message: 'User not found' });
        const u = results[0];
        res.json({ success: true, user: { id: u.id, username: u.username, perseroan: u.perseroan || null, role: u.role } });
    });
});

// Return perseroan (company) info by id
router.get('/perseroan', (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).json({ success: false, message: 'Missing perseroan id' });
    db.query('SELECT id, perseroan FROM perseroan WHERE id = ? LIMIT 1', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error', error: err });
        if (!results || !results.length) return res.status(404).json({ success: false, message: 'Perseroan not found' });
        const p = results[0];
        res.json({ success: true, perseroan: { id: p.id, perseroan: p.perseroan } });
    });
});
