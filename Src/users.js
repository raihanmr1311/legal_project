const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');

router.get('/users', (req, res) => {
    const sql = `SELECT u.id, u.username, u.role, u.perseroan, p.perseroan AS perseroan_name
                 FROM users u
                 LEFT JOIN perseroan p ON u.perseroan = p.id
                 ORDER BY u.id`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data user', error: err });
        }
        res.json({ success: true, users: results });
    });
});

router.get('/users/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT u.id, u.username, u.role, u.perseroan, p.perseroan AS perseroan_name
                 FROM users u
                 LEFT JOIN perseroan p ON u.perseroan = p.id
                 WHERE u.id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data user', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        res.json({ success: true, user: results[0] });
    });
});

router.post('/users', async (req, res) => {
    const { username, password, perseroan, role } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO users (username, password, perseroan, role) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, hashedPassword, perseroan || null, role || 'user'], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
                }
                return res.status(500).json({ success: false, message: 'Gagal membuat user', error: err });
            }
            res.json({ success: true, id: result.insertId });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat user' });
    }
});

router.put('/users/:id', async (req, res) => {
    const id = req.params.id;
    const { username, password, perseroan, role } = req.body;
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username wajib diisi' });
    }
    
    try {
        // First, fetch existing user so we can preserve fields that aren't provided
        db.query('SELECT perseroan FROM users WHERE id = ? LIMIT 1', [id], async (errFetch, rowsFetch) => {
            if (errFetch) {
                console.error('Error fetching existing user before update:', errFetch);
                return res.status(500).json({ success: false, message: 'Gagal mengambil data user', error: errFetch });
            }
            if (!rowsFetch || rowsFetch.length === 0) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }

            const existingPerseroan = rowsFetch[0].perseroan;
            // If the incoming perseroan is undefined/null/empty string, preserve existing value.
            const persToUse = (typeof perseroan === 'undefined' || perseroan === null || String(perseroan).trim() === '')
                ? existingPerseroan
                : perseroan;

            let sql, params;
            if (password && password.trim() !== '') {
                const hashedPassword = await bcrypt.hash(password, 10);
                sql = 'UPDATE users SET username = ?, password = ?, perseroan = ?, role = ? WHERE id = ?';
                params = [username, hashedPassword, persToUse || null, role || 'user', id];
            } else {
                sql = 'UPDATE users SET username = ?, perseroan = ?, role = ? WHERE id = ?';
                params = [username, persToUse || null, role || 'user', id];
            }

            db.query(sql, params, (err, result) => {
                if (err) {
                    console.error('Error updating user:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
                    }
                    return res.status(500).json({ success: false, message: 'Gagal mengupdate user', error: err });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
                }
                res.json({ success: true });
            });
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate user' });
    }
});

router.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ success: false, message: 'Gagal menghapus user', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
