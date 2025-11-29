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
  const transporter = nodemailer.createTransport(opts);
  await transporter.verify();
  return transporter;
}

module.exports = { createAndVerifyTransporter };
