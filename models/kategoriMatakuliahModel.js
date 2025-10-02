const db = require('../config/db');

// Mendapatkan semua kategori matakuliah
exports.getAllKategoriMatakuliah = (callback) => {
  const sql = 'SELECT * FROM kategori_matakuliah';
  db.query(sql, callback);
};

// Menambahkan kategori matakuliah baru
exports.createKategoriMatakuliah = (data, callback) => {
  const sql = 'INSERT INTO kategori_matakuliah (nama_kategori, detail) VALUES (?, ?)';
  const values = [data.nama_kategori, data.detail];
  db.query(sql, values, callback);
};

// Mengupdate kategori matakuliah berdasarkan ID
exports.updateKategoriMatakuliah = (id, data, callback) => {
  const sql = 'UPDATE kategori_matakuliah SET nama_kategori = ?, detail = ? WHERE id = ?';
  const values = [data.nama_kategori, data.detail, id];
  db.query(sql, values, callback);
};

// Menghapus kategori matakuliah berdasarkan ID
exports.deleteKategoriMatakuliah = (id, callback) => {
  const sql = 'DELETE FROM kategori_matakuliah WHERE id = ?';
  db.query(sql, [id], callback);
};

// Memeriksa apakah nama kategori matakuliah sudah ada
exports.isNamaMatakuliahExists = (nama_kategori, callback) => {
  const sql = 'SELECT id FROM kategori_matakuliah WHERE nama_kategori = ?';
  db.query(sql, [nama_kategori], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0); // Jika nama kategori ditemukan, berarti sudah ada
    }
  });
};

// Memeriksa apakah nama kategori sudah ada, kecuali untuk kategori yang sedang diupdate
exports.isNamaMatakuliahExistsExcludeId = (nama_kategori, id, callback) => {
  const sql = 'SELECT id FROM kategori_matakuliah WHERE nama_kategori = ? AND id != ?';
  db.query(sql, [nama_kategori, id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0); // Jika nama kategori ditemukan, berarti sudah ada
    }
  });
};

