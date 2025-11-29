const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';

const ports = process.env.TEST_PORTS ? process.env.TEST_PORTS.split(',').map(p => Number(p.trim())) : [2525, 587, 465];
const secureOptions = process.env.TEST_SECURE ? process.env.TEST_SECURE.split(',').map(v => v.trim() === 'true') : [false, true];
const tlsRejectOptions = process.env.TEST_TLS_REJECT ? process.env.TEST_TLS_REJECT.split(',').map(v => v.trim() === 'true') : [true, false];

async function tryConfig(port, secure, rejectUnauthorized) {
  const opts = {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    logger: true,
    debug: true,
    tls: { rejectUnauthorized }
  };

  console.log('\n=== Trying config ===');
  console.log('host:', host, 'port:', port, 'secure:', secure, 'tls.rejectUnauthorized:', rejectUnauthorized, 'authPresent:', !!opts.auth);

  const transporter = nodemailer.createTransport(opts);
  try {
    const ok = await transporter.verify();
    console.log('verify OK for port', port, 'secure', secure, 'rejectUnauthorized', rejectUnauthorized);
    return { ok: true };
  } catch (err) {
    console.error('verify FAILED:', err && err.message ? err.message : err);
    if (err && err.code) console.error('code:', err.code);
    return { ok: false, error: err };
  }
}

(async () => {
  console.log('SMTP connectivity tester');
  console.log('Using host from env EMAIL_HOST or default smtp.mailtrap.io');
  for (const port of ports) {
    for (const secure of secureOptions) {
      for (const rej of tlsRejectOptions) {
        // eslint-disable-next-line no-await-in-loop
        await tryConfig(port, secure, rej);
      }
    }
  }
  console.log('\nDone. Use the successful combination (port/secure/tls.rejectUnauthorized) as your SMTP settings.');
})();
