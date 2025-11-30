function parseAdminEmails(v) {
  if (!v) return [];
  v = String(v).trim();
  if (v.startsWith('[')) {
    try { return JSON.parse(v); } catch (e) { }
  }
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = {
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 2525,
  secure: (process.env.EMAIL_SECURE || 'false').toString().toLowerCase() === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS || '')
};
