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

function createAndVerifyTransporter() {
  const opts = makeTransportOptions();
  if (EMAIL_DEBUG) {
    console.log('Creating SMTP transporter with', { host: opts.host, port: opts.port, secure: opts.secure, user: opts.auth && opts.auth.user });
  }
  const transporter = nodemailer.createTransport(opts);
  return new Promise((resolve, reject) => {
    transporter.verify((err, success) => {
      if (err) {
        console.error('SMTP transporter verify failed:', err && err.message ? err.message : err);
        return reject(err);
      }
      console.log('SMTP transporter verified for', opts.auth && opts.auth.user);
      resolve(transporter);
    });
  });
}

async function sendViaSendGrid(from, to, subject, text) {
  const sgKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
  if (!sgKey) throw new Error('No SendGrid API key configured');
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sgKey);
    const msg = {
      to,
      from,
      subject,
      text
    };
    const res = await sgMail.send(msg);
    console.log('SendGrid send success for', to, { length: Array.isArray(res) ? res.length : undefined });
    return { provider: 'sendgrid', result: res };
  } catch (err) {
    console.error('SendGrid send failed:', err && err.message ? err.message : err);
    throw err;
  }
}

async function sendMailWithFallback({ from, to, subject, text }) {
  // First attempt SMTP
  try {
    const transporter = await createAndVerifyTransporter();
    try {
      const info = await transporter.sendMail({ from, to, subject, text });
      console.log('SMTP sendMail success for', to, { messageId: info && info.messageId, response: info && info.response });
      return { provider: 'smtp', info };
    } catch (sendErr) {
      console.error('SMTP sendMail failed, will try SendGrid fallback:', sendErr && sendErr.message ? sendErr.message : sendErr);
      // fall through to try SendGrid
    }
  } catch (verifyErr) {
    console.error('SMTP transporter verify failed, will try SendGrid fallback:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
  }

  // Try SendGrid if available
  const sgKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
  if (sgKey) {
    return await sendViaSendGrid(from, to, subject, text);
  }

  throw new Error('All mail providers failed (SMTP failed and no SendGrid API key)');
}

module.exports = { createAndVerifyTransporter, sendMailWithFallback };
