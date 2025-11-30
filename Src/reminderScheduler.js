const db = require('./db');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');
const cron = require('node-cron');
const util = require('util');

const EMAIL_DEBUG = (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true';

const { createAndVerifyTransporter } = require('./emailClient');

async function sendReminderEmail(to, subject, text) {
    throw new Error('sendReminderEmail should not be called directly without transporter');
}

function getRemindTypeAndField(tenggat) {
    const now = new Date();
    const deadline = new Date(tenggat);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 30) return { type: 'H-1 Bulan', field: 'reminder_h1_bulan_sent' };
    if (diffDays === 14) return { type: 'H-2 Minggu', field: 'reminder_h2_minggu_sent' };
    if (diffDays === 7) return { type: 'H-1 Minggu (7)', field: 'reminder_h1_minggu_7_sent' };
    if (diffDays === 5) return { type: 'H-1 Minggu (5)', field: 'reminder_h1_minggu_5_sent' };
    if (diffDays === 3) return { type: 'H-1 Minggu (3)', field: 'reminder_h1_minggu_3_sent' };
    if (diffDays === 1) return { type: 'H-1', field: 'reminder_h1_sent' };
    if (diffDays === 0) return { type: 'Hari-H', field: 'reminder_h_sent' };
    return null;
}

cron.schedule('06 11 * * *', async () => {
    try {
        console.log('Reminder cron triggered at', new Date().toISOString());
        db.query('SELECT * FROM laporan', async (err, results) => {
            if (err) {
                console.error('Failed to fetch laporan for reminders:', err && err.message ? err.message : err);
                return;
            }
            console.log('Reminder cron: fetched', Array.isArray(results) ? results.length : 0, 'laporan rows');
            const { createAndVerifyTransporter } = require('./emailClient');

            for (const laporan of results) {
                try {
                    const remind = getRemindTypeAndField(laporan.tanggal_pelaporan);
                    if (!remind) continue;
                    if (laporan[remind.field]) continue;
                    const emails = [laporan.email, ...(emailConfig.adminEmails || [])].filter(Boolean);
                    let subject = '';
                    let text = '';
                    switch (remind.type) {
                        case 'H-1 Bulan':
                            subject = 'Reminder: 1 Bulan Menuju Tenggat Pelaporan';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut akan jatuh tempo 1 bulan lagi, pada tanggal ${laporan.tanggal_pelaporan}.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'H-2 Minggu':
                            subject = 'Reminder: 2 Minggu Menuju Tenggat Pelaporan';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut akan jatuh tempo 2 minggu lagi, pada tanggal ${laporan.tanggal_pelaporan}.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'H-1 Minggu (7)':
                            subject = 'Reminder: 1 Minggu Menuju Tenggat Pelaporan';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut akan jatuh tempo 1 minggu lagi, pada tanggal ${laporan.tanggal_pelaporan}.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'H-1 Minggu (5)':
                            subject = 'Reminder: 5 Hari Menuju Tenggat Pelaporan';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut akan jatuh tempo 5 hari lagi, pada tanggal ${laporan.tanggal_pelaporan}.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'H-1 Minggu (3)':
                            subject = 'Reminder: 3 Hari Menuju Tenggat Pelaporan';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut akan jatuh tempo 3 hari lagi, pada tanggal ${laporan.tanggal_pelaporan}.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'H-1':
                            subject = 'Reminder: Besok Tenggat Pelaporan!';
                            text = `Halo,\n\nTenggat waktu pelaporan untuk laporan berikut adalah BESOK (${laporan.tanggal_pelaporan}).\n\nSegera lakukan pelaporan jika belum.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        case 'Hari-H':
                            subject = 'Reminder: Hari Ini Tenggat Pelaporan!';
                            text = `Halo,\n\nHari ini adalah tenggat waktu pelaporan untuk laporan berikut (${laporan.tanggal_pelaporan}).\n\nSegera lakukan pelaporan jika belum.\n\nDetail Laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                            break;
                        default:
                            subject = 'Reminder Tenggat Waktu Pelaporan';
                            text = `Reminder: Tenggat waktu pelaporan adalah ${laporan.tanggal_pelaporan}.\n\nNama Laporan: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}`;
                    }

                    let transporter = null;
                    try {
                        transporter = await createAndVerifyTransporter();
                    } catch (e) {
                        console.error('Failed to verify SMTP transporter for reminder run:', e && e.message ? e.message : e);
                    }

                    let anySuccess = false;
                    if (transporter) {
                        const { sendMailPromise } = require('./emailClient');
                        for (const to of emails) {
                            try {
                                console.log('Reminder: sending to', to, 'subject:', subject);
                                const info = await sendMailPromise(transporter, { from: emailConfig.auth.user, to, subject, text });
                                console.log('Reminder sendMail result for', to, { messageId: info && info.messageId, response: info && info.response });
                                anySuccess = true;
                            } catch (sendErr) {
                                console.error('Failed to send reminder to', to, sendErr && sendErr.message ? sendErr.message : sendErr);
                            }
                        }
                    } else {
                        console.warn('No transporter available for reminder send for laporan id=', laporan.id);
                    }

                    if (anySuccess) {
                        db.query(`UPDATE laporan SET ${remind.field}=1 WHERE id=?`, [laporan.id], (uErr) => {
                            if (uErr) console.error('Failed to update reminder flag for laporan', laporan.id, uErr && uErr.message ? uErr.message : uErr);
                        });
                    } else {
                        console.warn(`No reminder sent for laporan id=${laporan.id} (no recipients accepted).`);
                    }
                } catch (innerErr) {
                    console.error('Error processing laporan for reminders:', innerErr && innerErr.message ? innerErr.message : innerErr);
                }
            }
        });
    } catch (outerErr) {
        console.error('Unhandled error in reminder cron job:', outerErr && outerErr.message ? outerErr.message : outerErr);
    }
});

console.log('Scheduler email reminder aktif!');

async function sendAllRemindersForId(id, markAsSent = true) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM laporan WHERE id=?', [id], async (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return reject(new Error('Laporan not found'));
            const laporan = rows[0];
            const reminders = [
                { field: 'reminder_h1_bulan_sent', subject: 'Reminder: 1 Bulan Menuju Tenggat Pelaporan' },
                { field: 'reminder_h2_minggu_sent', subject: 'Reminder: 2 Minggu Menuju Tenggat Pelaporan' },
                { field: 'reminder_h1_minggu_7_sent', subject: 'Reminder: 1 Minggu (7 hari) Menuju Tenggat Pelaporan' },
                { field: 'reminder_h1_minggu_5_sent', subject: 'Reminder: 5 Hari Menuju Tenggat Pelaporan' },
                { field: 'reminder_h1_minggu_3_sent', subject: 'Reminder: 3 Hari Menuju Tenggat Pelaporan' },
                { field: 'reminder_h1_sent', subject: 'Reminder: Besok Tenggat Pelaporan!' },
                { field: 'reminder_h_sent', subject: 'Reminder: Hari Ini Tenggat Pelaporan!' }
            ];

            const recipientList = [laporan.email, ...(emailConfig.adminEmails || [])].filter(Boolean);
            const results = [];

            for (const r of reminders) {
                try {
                    const text = `Halo,\n\n${r.subject} untuk laporan:\nNama: ${laporan.nama_laporan}\nPeriode: ${laporan.periode_laporan}\nTahun: ${laporan.tahun_pelaporan}\nInstansi Tujuan: ${laporan.instansi_tujuan}\nTanggal Tenggat: ${laporan.tanggal_pelaporan}`;
                    let anySuccess = false;
                    let transporter = null;
                    try {
                        transporter = await createAndVerifyTransporter();
                    } catch (e) {
                        console.error('Failed to verify SMTP transporter for sendAllRemindersForId:', e && e.message ? e.message : e);
                    }
                    for (const to of recipientList) {
                        if (!transporter) {
                            results.push({ to, field: r.field, ok: false, error: 'No SMTP transporter available' });
                            continue;
                        }
                        try {
                            console.log('sendAllRemindersForId: sending', r.subject, 'to', to);
                            const info = await transporter.sendMail({ from: emailConfig.auth.user, to, subject: r.subject, text });
                            anySuccess = true;
                            console.log('sendAllRemindersForId: send result for', to, { messageId: info && info.messageId, response: info && info.response });
                            results.push({ to, field: r.field, ok: true, info });
                        } catch (sendErr) {
                            results.push({ to, field: r.field, ok: false, error: sendErr && sendErr.message ? sendErr.message : sendErr });
                        }
                    }
                    if (anySuccess && markAsSent) {
                        await new Promise((updResolve) => db.query(`UPDATE laporan SET ${r.field}=1 WHERE id=?`, [id], (uErr) => {
                            if (uErr) console.error('Failed to set reminder flag', r.field, uErr && uErr.message ? uErr.message : uErr);
                            updResolve();
                        }));
                    }
                } catch (e) {
                    results.push({ field: r.field, ok: false, error: e && e.message ? e.message : e });
                }
            }
            resolve(results);
        });
    });
}

module.exports.sendAllRemindersForId = sendAllRemindersForId;
