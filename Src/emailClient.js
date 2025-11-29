const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

const EMAIL_DEBUG = (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true';

function makeTransportOptions() {
  const opts = {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
    logger: EMAIL_DEBUG,
    debug: EMAIL_DEBUG,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  };
  if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED && process.env.EMAIL_TLS_REJECT_UNAUTHORIZED.toLowerCase() === 'false') {
    opts.tls = { rejectUnauthorized: false };
  }
  return opts;
}

async function createAndVerifyTransporter() {
  const opts = makeTransportOptions();
  if (EMAIL_DEBUG) {
    console.log('Creating SMTP transporter with', { host: opts.host, port: opts.port, secure: opts.secure, user: opts.auth && opts.auth.user });
  }
  const transporter = nodemailer.createTransport(opts);
  try {
    await transporter.verify();
    console.log('SMTP transporter verified for', opts.auth && opts.auth.user);
    return transporter;
  } catch (err) {
    console.error('SMTP transporter verify failed:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { createAndVerifyTransporter };
