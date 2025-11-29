
const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const multer = require('multer');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');

const bcrypt = require('bcryptjs');

// Jalankan scheduler email reminder
require('./reminderScheduler');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

app.use(bodyParser.json());

// Import form router
const formRouter = require('./form');
app.use('/api', formRouter);

// Note: `runRemindersNow` runner removed. Use `reminderScheduler.runPendingRemindersNow()` endpoint below.



// Endpoint upload Excel dan import ke database
app.post('/api/upload-excel', upload.single('excelFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }
    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        // Mapping kolom Excel ke kolom database
        const mappedRows = rows.map(row => ({
            lokasi: row['Lokasi'] || '',
            jenis_laporan: row['Jenis Laporan'] || '',
            periode_laporan: row['Periode Laporan'] || '',
            tahun: row['Tahun'] || '',
            nomor_surat_pengantar: row['Nomor Surat Pengantar'] || '',
            tanggal_surat: row['Tanggal Surat'] || '',
            instansi_tujuan: row['Instansi Tujuan'] || '',
            tanggal_dikirim: row['Tanggal Dikirim'] || '',
            status_laporan: row['Status Laporan'] || '',
            status_resi: row['Status Resi'] || '',
            file: row['File'] || '',
            keterangan: row['Keterangan'] || ''
        }));
        // Insert ke database satu per satu (bisa dioptimasi bulk insert)
        let inserted = 0;
        let failed = 0;
        let lastError = '';
        const insertNext = (i) => {
            if (i >= mappedRows.length) {
                return res.json({ success: true, message: `Berhasil import: ${inserted}, gagal: ${failed}` });
            }
            const row = mappedRows[i];
            db.query('INSERT INTO laporan SET ?', row, (err) => {
                if (err) { failed++; lastError = err.message; }
                else { inserted++; }
                insertNext(i+1);
            });
        };
        insertNext(0);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal memproses file: ' + e.message });
    }
});
// Endpoint login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username tidak ditemukan' });
        }
        const user = results[0];
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            bcrypt.compare(password, user.password, (err, match) => {
                if (match) {
                    res.json({ success: true, role: user.role });
                } else {
                    res.status(401).json({ success: false, message: 'Password salah' });
                }
            });
        } else {
            if (user.password === password) {
                res.json({ success: true, role: user.role });
            } else {
                res.status(401).json({ success: false, message: 'Password salah' });
            }
        }
    });
});


app.get('/api/laporan', (req, res) => {
    db.query('SELECT * FROM laporan ORDER BY id DESC LIMIT 50', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Gagal mengambil data dari database' });
            return;
        }
        res.json(results);
    });
});


app.use(express.static(path.join(__dirname, '../')));
app.use('/Assets', express.static(path.join(__dirname, '../Assets')));
app.use('/Src', express.static(path.join(__dirname, './')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Export Excel endpoint
app.get('/export-xlsx', (req, res) => {
    db.query('SELECT * FROM laporan', (err, results) => {
        if (err) {
            res.status(500).send('Gagal mengambil data dari database');
            return;
        }
        // Export ke Excel
        const ws = XLSX.utils.json_to_sheet(results);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });


        res.setHeader('Content-Disposition', 'attachment; filename="dashboard_laporan_bsp.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    });
});

// Optionally, handle favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.send('OK');
});

// Secure endpoint to trigger reminder runner from deployed server.
// Protect with RUN_REMINDER_TOKEN env var: set `RUN_REMINDER_TOKEN` in Railway and call with header `x-run-token: <token>` or JSON body `{ "token": "<token>" }`.
app.post('/api/run-reminders-now', async (req, res) => {
    const token = req.headers['x-run-token'] || req.body && req.body.token;
    if (!process.env.RUN_REMINDER_TOKEN) return res.status(500).json({ success: false, message: 'RUN_REMINDER_TOKEN not configured on server' });
    if (!token || token !== process.env.RUN_REMINDER_TOKEN) return res.status(403).json({ success: false, message: 'Invalid token' });
    try {
        const reminderScheduler = require('./reminderScheduler');
        const result = await reminderScheduler.runPendingRemindersNow();
        return res.json({ success: true, result });
    } catch (err) {
        console.error('Error running reminders via endpoint:', err && err.message ? err.message : err);
        return res.status(500).json({ success: false, message: 'Runner failed', error: err && err.message ? err.message : String(err) });
    }
});

// Endpoint to send all reminder types for a single laporan by id (protected)
const reminderScheduler = require('./reminderScheduler');
app.post('/api/send-reminders-for/:id', async (req, res) => {
    const token = req.headers['x-run-token'] || req.body && req.body.token;
    if (!process.env.RUN_REMINDER_TOKEN) return res.status(500).json({ success: false, message: 'RUN_REMINDER_TOKEN not configured on server' });
    if (!token || token !== process.env.RUN_REMINDER_TOKEN) return res.status(403).json({ success: false, message: 'Invalid token' });
    const id = req.params.id;
    const mark = req.body && typeof req.body.markRemindersAsSent !== 'undefined' ? Boolean(req.body.markRemindersAsSent) : true;
    try {
        const result = await reminderScheduler.sendAllRemindersForId(id, mark);
        res.json({ success: true, result });
    } catch (err) {
        console.error('Error sending reminders for id', id, err && err.message ? err.message : err);
        res.status(500).json({ success: false, message: 'Failed to send reminders', error: err && err.message ? err.message : String(err) });
    }
});

// Redirect root ke main.html
app.get('/', (req, res) => {
    res.redirect('/main.html');
});
app.listen(PORT, () => {
    console.log(`Dashboard running at http://localhost:${PORT}`);
    console.log(`Export Excel: http://localhost:${PORT}/export-xlsx`);
});

// Endpoint to run all pending reminders now (protected)
app.post('/api/run-reminders-pending', async (req, res) => {
    const token = req.headers['x-run-token'] || req.body && req.body.token;
    if (!process.env.RUN_REMINDER_TOKEN) return res.status(500).json({ success: false, message: 'RUN_REMINDER_TOKEN not configured on server' });
    if (!token || token !== process.env.RUN_REMINDER_TOKEN) return res.status(403).json({ success: false, message: 'Invalid token' });
    try {
        const result = await reminderScheduler.runPendingRemindersNow();
        res.json({ success: true, result });
    } catch (err) {
        console.error('Error running pending reminders:', err && err.message ? err.message : err);
        res.status(500).json({ success: false, message: 'Failed to run pending reminders', error: err && err.message ? err.message : String(err) });
    }
});