
const express = require('express');
const router = express.Router();
const db = require('./db');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

router.get('/laporan', (req, res) => {
    db.query('SELECT * FROM laporan', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil data laporan', error: err });
        }
        res.json(results);
    });
});

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
        res.json({ success: true });

        (async () => {
            try {
                const { createAndVerifyTransporter } = require('./emailClient');

                const adminSubject = 'Laporan Baru Telah Diinput';
                const adminText = `Notifikasi: Ada laporan baru yang telah diinput oleh ${pj} (email: ${email}).\n\nNama Laporan: ${nama_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_pelaporan}\nInstansi Tujuan: ${instansi_tujuan}\nTanggal Tenggat: ${tanggal_pelaporan}`;
                const userSubject = 'Reminder Tenggat Waktu Pelaporan';
                const userText = `Reminder: Tenggat waktu untuk pelaporan Anda adalah pada tanggal ${tanggal_pelaporan}.\n\nPastikan Anda melakukan pelaporan sebelum tenggat waktu tersebut.\n\nDetail Laporan:\nNama Laporan: ${nama_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_pelaporan}\nInstansi Tujuan: ${instansi_tujuan}`;

                const adminPromise = (async () => {
                    let transporter = null;
                    try {
                        transporter = await createAndVerifyTransporter();
                        console.log('Background email: transporter available =', !!transporter);
                    } catch (e) {
                        console.error('Failed to verify SMTP transporter for background email:', e && e.message ? e.message : e);
                        transporter = null;
                    }
                    try {
                        if (transporter && emailConfig.adminEmails && emailConfig.adminEmails.length) {
                            console.log('Sending admin notification to', emailConfig.adminEmails);
                            for (const admin of emailConfig.adminEmails) {
                                try {
                                    const info = await transporter.sendMail({ from: emailConfig.auth.user, to: admin, subject: adminSubject, text: adminText });
                                    console.log('Admin sendMail result for', admin, { messageId: info && info.messageId, response: info && info.response });
                                } catch (e) {
                                    console.error('Failed to send admin notification to', admin, e && e.message ? e.message : e);
                                }
                            }
                        } else {
                            console.log('Admin notification skipped (no transporter or no admin emails)');
                        }
                    } catch (e) {
                        console.error('Failed to send admin notification email:', e && e.message ? e.message : e);
                    }
                })();

                const userPromise = (async () => {
                    try {
                        if (email) {
                            console.log('Sending user notification to', email);
                            let transporter = null;
                            try {
                                transporter = await createAndVerifyTransporter();
                            } catch (e) {
                                console.error('Failed to verify SMTP transporter for user email:', e && e.message ? e.message : e);
                                transporter = null;
                            }
                            if (transporter) {
                                try {
                                    const info = await transporter.sendMail({ from: emailConfig.auth.user, to: email, subject: userSubject, text: userText });
                                    console.log('User sendMail result:', { messageId: info && info.messageId, response: info && info.response });
                                } catch (e) {
                                    console.error('Failed to send user notification email:', e && e.message ? e.message : e);
                                }
                            } else {
                                console.log('User notification skipped (no transporter)');
                            }
                        } else {
                            console.log('User notification skipped (no user email)');
                        }
                    } catch (e) {
                        console.error('Failed to send user notification email:', e && e.message ? e.message : e);
                    }
                })();

                await Promise.allSettled([adminPromise, userPromise]);
            } catch (err) {
                console.error('Unhandled error while sending notification emails:', err && err.message ? err.message : err);
            }
        })();
    });
});

module.exports = router;
 
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

router.delete('/laporan/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM laporan WHERE id=?', [id], (err, result) => {
        if (err) {
            return res.json({ success: false, message: 'Gagal hapus data', error: err });
        }
        res.json({ success: true });
    });
});
