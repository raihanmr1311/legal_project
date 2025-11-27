const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');
const util = require('util');

async function sendTest(to) {
  const cfg = {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
    logger: (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true',
    debug: (process.env.EMAIL_DEBUG || 'false').toString().toLowerCase() === 'true'
  };

  if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED && process.env.EMAIL_TLS_REJECT_UNAUTHORIZED.toLowerCase() === 'false') {
    cfg.tls = { rejectUnauthorized: false };
  }

  const transporter = nodemailer.createTransport(cfg);

  const target = to || (emailConfig.adminEmails && emailConfig.adminEmails[0]) || (emailConfig.auth && emailConfig.auth.user);
  if (!target) {
    console.error('No recipient configured. Set ADMIN_EMAILS env var or pass an email as argument.');
    process.exit(1);
  }

  try {
    await transporter.verify();
    console.log('SMTP connection verified. Sending test email to:', target);

    const info = await transporter.sendMail({
      from: emailConfig.auth.user,
      to: target,
      subject: 'Test Email from legal_project',
      text: 'This is a test email to verify SMTP configuration.'
    });

    console.log('Email sent successfully. MessageId:', info.messageId);
    console.log('Info object:', util.inspect(info, { depth: 5 }));
    process.exit(0);
  } catch (err) {
    console.error('Failed to send test email. Full error below:');
    try { console.error(util.inspect(err, { depth: 5 })); } catch(e) { console.error('Error printing details:', e); }
    if (err && err.code) console.error('Error code:', err.code);
    if (err && err.response) console.error('SMTP response:', err.response.toString ? err.response.toString() : err.response);
    if (err && err.stack) console.error('Stack:', err.stack);
    process.exit(1);
  }
}

const [, , to] = process.argv;
sendTest(to);
