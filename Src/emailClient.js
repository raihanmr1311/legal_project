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

function sendMailPromise(transporter, mailOptions) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return reject(err);
      }
      resolve(info);
    });
  });
}

module.exports = { createAndVerifyTransporter, sendMailPromise };
