// Konfigurasi email untuk pengiriman notifikasi
// Ganti sesuai data SMTP Anda
module.exports = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'edwardpayaka@gmail.com', // ganti dengan email admin
    pass: 'efasnfhelifcpmeo' // gunakan app password, bukan password biasa
  },
  adminEmails: [
    'peyekslurd@gmail.com',
    'admin2@gmail.com'
  ]
};
