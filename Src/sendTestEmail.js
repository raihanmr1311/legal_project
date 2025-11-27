const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

async function sendTest(to) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
  });

  const target = to || (emailConfig.adminEmails && emailConfig.adminEmails[0]) || emailConfig.auth.user;
  if (!target) {
    console.error('No recipient configured. Set ADMIN_EMAILS or pass an email as argument.');
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: emailConfig.auth.user,
      to: target,
      subject: 'Test Email from legal_project',
      text: 'This is a test email to verify SMTP configuration.'
    });
    console.log('Email sent:', info.messageId || info);
    process.exit(0);
  } catch (e) {
    console.error('Failed to send email:', e.message || e);
    process.exit(1);
  }
}

const [, , to] = process.argv;
sendTest(to);
