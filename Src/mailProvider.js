const util = require('util');

let sendgrid = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.warn('SendGrid package not available or failed to initialize:', e && e.message ? e.message : e);
    sendgrid = null;
  }
}

// sendMail options: { to, from, subject, text, html, transporter }
async function sendMail(opts = {}) {
  const { to, from, subject, text, html, transporter } = opts;
  const fromAddr = from || process.env.EMAIL_USER;

  const provider = (process.env.MAIL_PROVIDER || 'auto').toLowerCase();

  // Helper to send via SMTP transporter if provided
  async function sendViaSmtp() {
    if (!transporter) throw new Error('No SMTP transporter provided');
    return transporter.sendMail({ from: fromAddr, to, subject, text, html });
  }

  // Helper to send via SendGrid if configured
  async function sendViaSendGrid() {
    if (!sendgrid) throw new Error('SendGrid not configured');
    const msg = {
      to,
      from: fromAddr,
      subject,
    };
    if (text) msg.text = text;
    if (html) msg.html = html;
    return sendgrid.send(msg);
  }

  // Decide behavior
  try {
    if (provider === 'sendgrid') {
      const res = await sendViaSendGrid();
      return { ok: true, provider: 'sendgrid', info: res };
    }

    if (provider === 'smtp') {
      const res = await sendViaSmtp();
      return { ok: true, provider: 'smtp', info: res };
    }

    // auto: try SMTP first, then SendGrid
    try {
      const r = await sendViaSmtp();
      return { ok: true, provider: 'smtp', info: r };
    } catch (smtpErr) {
      // If sendgrid is available, try it
      if (sendgrid) {
        try {
          const r2 = await sendViaSendGrid();
          return { ok: true, provider: 'sendgrid', info: r2, fallbackFrom: smtpErr && smtpErr.message ? smtpErr.message : smtpErr };
        } catch (sgErr) {
          return { ok: false, error: sgErr, details: { smtpError: smtpErr } };
        }
      }
      return { ok: false, error: smtpErr };
    }
  } catch (e) {
    return { ok: false, error: e };
  }
}

module.exports = { sendMail };
