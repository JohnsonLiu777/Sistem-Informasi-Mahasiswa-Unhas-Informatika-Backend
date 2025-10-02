const mysql = require('mysql2');
require('dotenv').config(); // agar bisa pakai variabel dari .env

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke database:', err.message);
  } else {
    console.log('✅ Terhubung ke database MySQL');
  }
});

module.exports = db;
