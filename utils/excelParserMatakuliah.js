// utils/excelParserMatakuliah.js
const xlsx = require('xlsx');
const db = require('../config/db');

// Fungsi untuk memeriksa apakah kode_mk sudah ada
const isKodeMkExists = async (kode_mk) => {
  const [rows] = await db.promise().query(`SELECT id FROM matakuliah WHERE kode_mk = ?`, [kode_mk]);
  return rows.length ? true : false;
};

// Fungsi untuk mengonversi data tahun kurikulum (jika perlu validasi)
const validateKurikulum = (kurikulum) => {
  return !isNaN(kurikulum) && kurikulum > 0;
};

// Fungsi untuk parsing file Excel dan mengimpor data matakuliah
const parseExcelAndImportMatakuliah = async (filePath) => {
  const workbook = xlsx.readFile(filePath);  // Membaca file Excel
  const sheet = workbook.Sheets[workbook.SheetNames[0]];  // Mengambil sheet pertama
  const data = xlsx.utils.sheet_to_json(sheet);  // Mengonversi sheet ke format JSON

  const results = [];
  const failedRecords = [];

  // Proses setiap baris data dari Excel
  for (const row of data) {
    const { kode_mk, nama_mk, sks, kurikulum } = row;

    // Validasi: Pastikan semua field wajib diisi
    if (!kode_mk || !nama_mk || !sks || !kurikulum) {
      failedRecords.push({ ...row, status: 'Gagal', error: 'Kode MK, Nama MK, SKS, dan Kurikulum wajib diisi' });
      continue;
    }

    // Validasi tahun kurikulum
    if (!validateKurikulum(kurikulum)) {
      failedRecords.push({ ...row, status: 'Gagal', error: `Kurikulum ${kurikulum} tidak valid` });
      continue;
    }

    // Cek apakah kode_mk sudah ada
    const exists = await isKodeMkExists(kode_mk);
    const values = [kode_mk, nama_mk, sks, kurikulum];

    if (exists) {
      // Jika kode_mk sudah ada, kirim pesan gagal
      failedRecords.push({ ...row, status: 'Gagal', error: `Kode MK ${kode_mk} sudah ada di database` });
      continue;
    } else {
      // Insert jika kode_mk belum ada
      await db.promise().query(
        `INSERT INTO matakuliah (kode_mk, nama_mk, sks, kurikulum) VALUES (?, ?, ?, ?)`,
        values
      );
      results.push({ ...row, status: 'Inserted' });
    }
  }

  return { results, failedRecords };
};


module.exports = { parseExcelAndImportMatakuliah };
