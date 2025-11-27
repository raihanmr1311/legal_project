const db = require('./db');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

const util = require('util');

const EMAIL_DEBUG = (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true';

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

async function runOnce() {
  db.query('SELECT * FROM laporan LIMIT 50', async (err, results) => {
    if (err) {
      console.error('Failed to fetch laporan:', err && err.message ? err.message : err);
      process.exit(1);
    }
    for (const lap of results) {
      const remind = getRemindTypeAndField(lap.tanggal_pelaporan);
      if (!remind) continue;
      if (lap[remind.field]) continue;
      const emails = [lap.email, ...(emailConfig.adminEmails || [])].filter(Boolean);
      let subject = `Manual test reminder for laporan ${lap.id}`;
      let text = `Ini adalah tes manual reminder untuk laporan id=${lap.id} tanggal_pelaporan=${lap.tanggal_pelaporan}`;
      let anySuccess = false;
      for (const to of emails) {
        const r = await sendReminderEmail(to, subject, text);
        if (r.ok) anySuccess = true;
      }
      if (anySuccess) {
        console.log('At least one recipient accepted for laporan', lap.id);
      } else {
        console.warn('No recipient accepted for laporan', lap.id);
      }
    }
    console.log('runRemindersNow finished');
    process.exit(0);
  });
}

// verify transporter first
transporter.verify().then(() => {
  console.log('SMTP verified — running reminder check now');
  runOnce();
}).catch(err => {
  console.error('SMTP verification failed — aborting runRemindersNow:', err && err.message ? err.message : err);
  if (EMAIL_DEBUG) console.error(util.inspect(err, { depth: 5 }));
  process.exit(1);
});
