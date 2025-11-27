// Scheduler pengiriman email reminder tenggat waktu laporan
const db = require('./db');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');
const cron = require('node-cron');
const util = require('util');

// Tambahkan dukungan debug lewat env var
const EMAIL_DEBUG = (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true';

// Buat transporter sekali saja dan verifikasi koneksi saat startup
const transporterOptions = {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
    logger: EMAIL_DEBUG,
    debug: EMAIL_DEBUG
};

if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED && process.env.EMAIL_TLS_REJECT_UNAUTHORIZED.toLowerCase() === 'false') {
    transporterOptions.tls = { rejectUnauthorized: false };
}

const transporter = nodemailer.createTransport(transporterOptions);

transporter.verify().then(() => {
    console.log('SMTP transporter verified successfully.');
}).catch(err => {
    console.error('SMTP transporter verification failed:', util.inspect(err, { depth: 3 }));
});

async function sendReminderEmail(to, subject, text) {
    try {
        const info = await transporter.sendMail({
            from: emailConfig.auth.user,
            to,
            subject,
            text
        });
        if (EMAIL_DEBUG) console.log('sendMail success:', to, info.messageId);
        return { ok: true, info };
    } catch (err) {
        console.error(`Failed to send reminder to ${to}:`, err && err.message ? err.message : err);
        if (EMAIL_DEBUG) console.error(util.inspect(err, { depth: 5 }));
        return { ok: false, error: err };
    }
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


cron.schedule('0 7 * * *', async () => {
    try {
        db.query('SELECT * FROM laporan', async (err, results) => {
            if (err) {
                console.error('Failed to fetch laporan for reminders:', err && err.message ? err.message : err);
                return;
            }
            for (const laporan of results) {
                try {
                    const remind = getRemindTypeAndField(laporan.tanggal_pelaporan);
                    if (!remind) continue;
                    // Cek status kolom reminder
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

                    // Kirim satu per satu, catat apakah ada yang sukses
                    let anySuccess = false;
                    for (const to of emails) {
                        const result = await sendReminderEmail(to, subject, text);
                        if (result.ok) anySuccess = true;
                    }

                    // Jika setidaknya satu berhasil, tandai reminder di DB
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
