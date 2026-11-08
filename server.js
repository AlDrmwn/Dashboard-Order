const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static('public'));

// Koneksi ke Database MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke Database MySQL:', err);
        return;
    }
    console.log('Terhubung ke Database MySQL!');
});

// --- MIDDLEWARE API KEY ---
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ISP_SECRET_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: API Key tidak valid atau tidak ditemukan.'
        });
    }
    next();
};

// --- ROUTE & API ENDPOINTS ---
app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, data: results });
    });
});

app.post('/api/orders', (req, res) => {
    const { customer_name, phone, address, package_name } = req.body;
    if (!customer_name || !phone || !address || !package_name) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const query = 'INSERT INTO orders (customer_name, phone, address, package_name) VALUES (?, ?, ?, ?)';
    db.query(query, [customer_name, phone, address, package_name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            success: true,
            message: 'Order berhasil ditambahkan!',
            orderId: result.insertId
        });
    });
});

app.post('/api/isp/incoming-order', verifyApiKey, (req, res) => {
    const { customer_name, phone, address, package_name } = req.body;
    if (!customer_name || !phone || !address || !package_name) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const query = 'INSERT INTO orders (customer_name, phone, address, package_name) VALUES (?, ?, ?, ?)';
    db.query(query, [customer_name, phone, address, package_name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            success: true,
            message: 'Order dari ISP berhasil diterima!',
            orderId: result.insertId
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
