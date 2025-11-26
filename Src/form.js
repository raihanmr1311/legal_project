
const express = require('express');
const router = express.Router();
const db = require('./db');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

// GET /api/laporan - Ambil semua data laporan
router.get('/laporan', (req, res) => {
    db.query('SELECT * FROM laporan', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil data laporan', error: err });
        }
        res.json(results);
    });
});

// POST /api/upload-file (insert laporan)
router.post('/upload-file', (req, res) => {
    const {
        pj,
        email,
        nama_laporan,
        periode_laporan,
        tahun_pelaporan,
        instansi_tujuan,
        tanggal_pelaporan,
        keterangan
    } = req.body;

    if (!pj || !email || !nama_laporan || !periode_laporan || !tahun_pelaporan || !instansi_tujuan || !tanggal_pelaporan) {
        return res.json({ success: false, message: 'Semua field wajib diisi!' });
    }

    const sql = `INSERT INTO laporan (pj, email, nama_laporan, periode_laporan, tahun_pelaporan, instansi_tujuan, tanggal_pelaporan, keterangan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [pj, email, nama_laporan, periode_laporan, tahun_pelaporan, instansi_tujuan, tanggal_pelaporan, keterangan], async (err, result) => {
        if (err) {
            return res.json({ success: false, message: 'Gagal menyimpan ke database', error: err });
        }
        // Kirim email notifikasi ke admin dan user
        try {
            const transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                auth: emailConfig.auth
            });
            const adminSubject = 'Laporan Baru Telah Diinput';
            const adminText = `Notifikasi: Ada laporan baru yang telah diinput oleh ${pj} (email: ${email}).\n\nNama Laporan: ${nama_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_pelaporan}\nInstansi Tujuan: ${instansi_tujuan}\nTanggal Tenggat: ${tanggal_pelaporan}`;
            const userSubject = 'Reminder Tenggat Waktu Pelaporan';
            const userText = `Reminder: Tenggat waktu untuk pelaporan Anda adalah pada tanggal ${tanggal_pelaporan}.\n\nPastikan Anda melakukan pelaporan sebelum tenggat waktu tersebut.\n\nDetail Laporan:\nNama Laporan: ${nama_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_pelaporan}\nInstansi Tujuan: ${instansi_tujuan}`;
            // Kirim ke admin
            await transporter.sendMail({
                from: emailConfig.auth.user,
                to: emailConfig.adminEmails,
                subject: adminSubject,
                text: adminText
            });
            // Kirim ke user
            await transporter.sendMail({
                from: emailConfig.auth.user,
                to: email,
                subject: userSubject,
                text: userText
            });
        } catch (mailErr) {
            // Email gagal, tapi data tetap tersimpan
            return res.json({ success: true, message: 'Data tersimpan, tapi email gagal dikirim', error: mailErr });
        }
        res.json({ success: true });
    });
});

module.exports = router;
// Update laporan
router.put('/laporan/:id', (req, res) => {
    const id = req.params.id;
    const {
        pj,
        nama_laporan,
        periode_laporan,
        tahun_pelaporan,
        instansi_tujuan,
        tanggal_pelaporan,
        keterangan
    } = req.body;
    if (!pj || !nama_laporan || !periode_laporan || !tahun_pelaporan || !instansi_tujuan || !tanggal_pelaporan) {
        return res.json({ success: false, message: 'Semua field wajib diisi!' });
    }
    // Ambil tanggal_pelaporan lama
    db.query('SELECT tanggal_pelaporan FROM laporan WHERE id=?', [id], (err, rows) => {
        if (err || !rows.length) {
            return res.json({ success: false, message: 'Data tidak ditemukan', error: err });
        }
        const oldTanggal = rows[0].tanggal_pelaporan;
        let resetReminder = '';
        if (oldTanggal !== tanggal_pelaporan) {
            resetReminder = ', reminder_h1_bulan_sent=0, reminder_h2_minggu_sent=0, reminder_h1_minggu_7_sent=0, reminder_h1_minggu_5_sent=0, reminder_h1_minggu_3_sent=0, reminder_h1_sent=0, reminder_h_sent=0';
        }
        const sql = `UPDATE laporan SET pj=?, nama_laporan=?, periode_laporan=?, tahun_pelaporan=?, instansi_tujuan=?, tanggal_pelaporan=?, keterangan=?${resetReminder} WHERE id=?`;
        db.query(sql, [pj, nama_laporan, periode_laporan, tahun_pelaporan, instansi_tujuan, tanggal_pelaporan, keterangan, id], (err2, result) => {
            if (err2) {
                return res.json({ success: false, message: 'Gagal update data', error: err2 });
            }
            res.json({ success: true });
        });
    });
});

// Hapus laporan
router.delete('/laporan/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM laporan WHERE id=?', [id], (err, result) => {
        if (err) {
            return res.json({ success: false, message: 'Gagal hapus data', error: err });
        }
        res.json({ success: true });
    });
});
