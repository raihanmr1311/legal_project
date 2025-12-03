
const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');
 

router.get('/laporan', (req, res) => {
    
    let sql = `SELECT l.*, p.perseroan AS perseroan_name, p.id AS perseroan_id
                 FROM laporan l
                 LEFT JOIN perseroan p ON l.perseroan = p.id`;
    const params = [];
    if (req.query && req.query.perseroan_id) {
        sql += ' WHERE l.perseroan = ?';
        params.push(req.query.perseroan_id);
    }
    db.query(sql, params, (err, results) => {
        if (err) {
            
            return db.query('SELECT * FROM laporan', (err2, results2) => {
                if (err2) return res.status(500).json({ success: false, message: 'Gagal mengambil data laporan', error: err2 });
                return res.json(results2);
            });
        }
        
        const normalized = results.map(r => ({
            ...r,
            perseroan: r.perseroan_name || r.perseroan || (r.perseroan_id ? r.perseroan_id : ''),
            nama_laporan: r.nama_laporan || r.jenis_laporan || '',
            tahun_pelaporan: r.tahun_pelaporan || r.tahun_laporan || '',
            tanggal_pelaporan: r.tanggal_pelaporan || r.tanggal_dikirim || '',
            file: r.file || null,
            email: r.email || null,
            status: r.status || null
        }));
        res.json(normalized);
    });
});

router.post('/upload-file', (req, res) => {
    console.log('POST /api/upload-file body:', req.body);
    const {
        perseroan,
        perseroan_id,
        jenis_laporan,
        periode_laporan,
        tahun_laporan,
        instansi_tujuan,
        tanggal_dikirim,
        status,
        file,
        keterangan,
        email
    } = req.body;

    
    if (!jenis_laporan || !periode_laporan || !tahun_laporan || !instansi_tujuan || !tanggal_dikirim) {
        return res.status(400).json({ success: false, message: 'Field wajib: jenis_laporan, periode_laporan, tahun_laporan, instansi_tujuan, tanggal_dikirim' });
    }

    
    const resolvePerseroanId = (val, cb) => {
        if (!val) return cb(null, null);
        
        if (typeof val === 'number' || String(val).match(/^\d+$/)) {
            return cb(null, Number(val));
        }
        
        db.query('SELECT id FROM perseroan WHERE perseroan = ? LIMIT 1', [val], (err1, rows1) => {
            if (err1) {
                
                const sql = 'SELECT id FROM users WHERE username = ? OR perseroan = ? LIMIT 1';
                return db.query(sql, [val, val], (err2, rows2) => {
                    if (err2) return cb(err2);
                    if (rows2 && rows2.length) return cb(null, rows2[0].id);
                    return cb(null, null);
                });
            }
            if (rows1 && rows1.length) return cb(null, rows1[0].id);
            
            db.query('SELECT id, perseroan, perseroan_id FROM users WHERE username = ? LIMIT 1', [val], (err3, rows3) => {
                if (err3) return cb(err3);
                if (rows3 && rows3.length) {
                    
                    const u = rows3[0];
                    if (u.perseroan_id) return cb(null, Number(u.perseroan_id));
                    if (u.perseroan && String(u.perseroan).match(/^\d+$/)) return cb(null, Number(u.perseroan));
                    return cb(null, null);
                }
                return cb(null, null);
            });
        });
    };

    resolvePerseroanId(perseroan || perseroan_id, (err, resolvedPerseroanId) => {
        if (err) {
            console.error('Error resolving perseroan:', err && err.message ? err.message : err);
            return res.status(500).json({ success: false, message: 'Gagal resolve perseroan', error: err && err.message ? err.message : String(err) });
        }

        
        const insertSql = `INSERT INTO laporan (perseroan, jenis_laporan, periode_laporan, tahun_laporan, instansi_tujuan, tanggal_dikirim, status, file, email, keterangan)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const vals = [resolvedPerseroanId || null, jenis_laporan, periode_laporan, tahun_laporan, instansi_tujuan, tanggal_dikirim, status || 'pending', file || null, email || null, keterangan || null];

        db.query(insertSql, vals, (err2, result) => {
            if (err2) {
                console.error('INSERT laporan failed:', err2 && err2.message ? err2.message : err2, { sql: insertSql, vals });
                return res.status(500).json({ success: false, message: 'Gagal menyimpan ke database', error: err2 && err2.message ? err2.message : String(err2) });
            }

            res.json({ success: true, id: result.insertId });

            
            (async () => {
                try {
                    const { createAndVerifyTransporter, sendMailPromise } = require('./emailClient');

                    const adminSubject = 'Laporan Baru Telah Diinput';
                    const adminText = `Notifikasi: Ada laporan baru yang telah diinput${email ? ' (email: ' + email + ')' : ''}.\n\nJenis Laporan: ${jenis_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_laporan}\nInstansi Tujuan: ${instansi_tujuan}\nTanggal Dikirim: ${tanggal_dikirim}\nKeterangan: ${keterangan || ''}`;

                    const userSubject = 'Konfirmasi Penerimaan Laporan';
                    const userText = `Terima kasih. Laporan Anda telah diterima.\n\nJenis Laporan: ${jenis_laporan}\nPeriode: ${periode_laporan}\nTahun: ${tahun_laporan}\nTanggal Dikirim: ${tanggal_dikirim}\nKeterangan: ${keterangan || ''}`;

                    let transporter = null;
                    try {
                        transporter = await createAndVerifyTransporter();
                        console.log('Background email: transporter available =', !!transporter);
                    } catch (e) {
                        console.error('Failed to verify SMTP transporter for background email:', e && e.message ? e.message : e);
                        transporter = null;
                    }

                    const adminPromise = (async () => {
                        if (transporter && emailConfig.adminEmails && emailConfig.adminEmails.length) {
                            for (const admin of emailConfig.adminEmails) {
                                try {
                                    await sendMailPromise(transporter, { from: emailConfig.auth.user, to: admin, subject: adminSubject, text: adminText });
                                } catch (e) {
                                    console.error('Failed to send admin notification to', admin, e && e.message ? e.message : e);
                                }
                            }
                        } else {
                            console.log('Admin notification skipped (no transporter or no admin emails)');
                        }
                    })();

                    const userPromise = (async () => {
                        if (email) {
                            if (transporter) {
                                try {
                                    await sendMailPromise(transporter, { from: emailConfig.auth.user, to: email, subject: userSubject, text: userText });
                                    console.log('User notification sent to', email);
                                } catch (e) {
                                    console.error('Failed to send user notification email to', email, e && e.message ? e.message : e);
                                }
                            } else {
                                console.log('User notification skipped (no transporter)');
                            }
                        } else {
                            console.log('User notification skipped (no user email)');
                        }
                    })();

                    await Promise.allSettled([adminPromise, userPromise]);
                } catch (errNotify) {
                    console.error('Unhandled error while sending notification emails:', errNotify && errNotify.message ? errNotify.message : errNotify);
                }
            })();
        });
    });
});



router.put('/laporan/:id', (req, res) => {
    const id = req.params.id;
    const {
        perseroan,
        perseroan_id,
        jenis_laporan,
        periode_laporan,
        tahun_laporan,
        instansi_tujuan,
        tanggal_dikirim,
        status,
        file,
        email,
        keterangan
    } = req.body;

    db.query('SELECT tanggal_dikirim FROM laporan WHERE id=?', [id], (err, rows) => {
        if (err || !rows.length) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan', error: err });
        }
        const oldTanggal = rows[0].tanggal_dikirim;
        const newTanggal = tanggal_dikirim || oldTanggal;
        let resetReminder = '';
        if (oldTanggal !== newTanggal) {
            resetReminder = ', reminder_h1_bulan_sent=0, reminder_h2_minggu_sent=0, reminder_h1_minggu_7_sent=0, reminder_h1_minggu_5_sent=0, reminder_h1_minggu_3_sent=0, reminder_h1_sent=0, reminder_h_sent=0';
        }

        const resolvePerseroanId = (val, cb) => {
            if (!val) return cb(null, null);
            if (typeof val === 'number' || String(val).match(/^\d+$/)) return cb(null, Number(val));
            db.query('SELECT id FROM perseroan WHERE perseroan = ? LIMIT 1', [val], (err1, rows1) => {
                if (err1) {
                    return db.query('SELECT id FROM users WHERE username = ? LIMIT 1', [val], (err2, r) => {
                        if (err2) return cb(err2);
                        if (r && r.length) return cb(null, r[0].id);
                        return cb(null, null);
                    });
                }
                if (rows1 && rows1.length) return cb(null, rows1[0].id);
                
                db.query('SELECT id, perseroan, perseroan_id FROM users WHERE username = ? LIMIT 1', [val], (err3, rows3) => {
                    if (err3) return cb(err3);
                    if (rows3 && rows3.length) {
                        const u = rows3[0];
                        if (u.perseroan_id) return cb(null, Number(u.perseroan_id));
                        if (u.perseroan && String(u.perseroan).match(/^\d+$/)) return cb(null, Number(u.perseroan));
                        return cb(null, null);
                    }
                    return cb(null, null);
                });
            });
        };

        resolvePerseroanId(perseroan || perseroan_id, (errResolve, resolvedPerseroanId) => {
            if (errResolve) return res.status(500).json({ success: false, message: 'Gagal resolve perseroan', error: errResolve && errResolve.message ? errResolve.message : errResolve });

            const sql = `UPDATE laporan SET perseroan=?, jenis_laporan=?, periode_laporan=?, tahun_laporan=?, instansi_tujuan=?, tanggal_dikirim=?, status=?, file=?, email=?, keterangan=?${resetReminder} WHERE id=?`;
            const vals = [resolvedPerseroanId || null, jenis_laporan || null, periode_laporan || null, tahun_laporan || null, instansi_tujuan || null, tanggal_dikirim || null, status || null, file || null, email || null, keterangan || null, id];
            db.query(sql, vals, (err3, result) => {
                if (err3) {
                    console.error('UPDATE laporan failed:', err3 && err3.message ? err3.message : err3, { sql, vals });
                    return res.status(500).json({ success: false, message: 'Gagal update data', error: err3 && err3.message ? err3.message : String(err3) });
                }
                res.json({ success: true });
            });
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

module.exports = router;
