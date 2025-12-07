const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username dan password diperlukan' });
        }
        
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error('Login DB error:', err && err.message ? err.message : err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Username tidak ditemukan' });
            }
            const user = results[0];

            const respondWithPerseroanId = (userObj) => {
                try {
                    const raw = userObj.perseroan;
                    if (raw && String(raw).match(/^\d+$/)) {
                        const pid = Number(raw);
                        return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: pid, userId: userObj.id });
                    }
                    db.query('SELECT id FROM perseroan WHERE perseroan = ? LIMIT 1', [raw || ''], (err2, rows2) => {
                        if (err2) {
                            console.error('Perseroan lookup error:', err2 && err2.message ? err2.message : err2);
                            return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: null, userId: userObj.id });
                        }
                        if (rows2 && rows2.length) return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: rows2[0].id, userId: userObj.id });
                        return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: null, userId: userObj.id });
                    });
                } catch (e) {
                    console.error('respondWithPerseroanId error:', e && e.message ? e.message : e);
                    return res.json({ success: true, role: userObj.role, perseroan: userObj.perseroan || null, perseroan_id: null, userId: userObj.id });
                }
            };

            try {
                if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                    bcrypt.compare(password, user.password, (err, match) => {
                        try {
                            if (err) {
                                console.error('bcrypt compare error:', err && err.message ? err.message : err);
                                return res.status(500).json({ success: false, message: 'Server error' });
                            }
                            if (match) {
                                return respondWithPerseroanId(user);
                            } else {
                                return res.status(401).json({ success: false, message: 'Password salah' });
                            }
                        } catch (e) {
                            console.error('bcrypt callback error:', e && e.message ? e.message : e);
                            return res.status(500).json({ success: false, message: 'Server error' });
                        }
                    });
                } else {
                    if (user.password === password) {
                        return respondWithPerseroanId(user);
                    } else {
                        return res.status(401).json({ success: false, message: 'Password salah' });
                    }
                }
            } catch (e) {
                console.error('Password check error:', e && e.message ? e.message : e);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
        });
    } catch (e) {
        console.error('Login endpoint error:', e && e.message ? e.message : e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
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
