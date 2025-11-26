const express = require('express');
const router = express.Router();
const db = require('./db');

// Endpoint untuk mengambil daftar penanggung jawab unik dari tabel laporan
router.get('/pj', (req, res) => {
    db.query('SELECT DISTINCT pj FROM laporan ORDER BY pj ASC', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil data PJ', error: err });
        }
        res.json(results.map(row => row.pj));
    });
});

module.exports = router;
