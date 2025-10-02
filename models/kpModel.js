// models/kpModel.js
const db = require('../config/db');

// Fungsi untuk mendapatkan detail KP mahasiswa beserta matakuliah kategori KP (nama, kurikulum, kategori, SKS)
exports.getDetailKP = (id, callback) => {
  const query = `
    SELECT kp.id AS kp_id, kp.tempat_kp, kp.tgl_mulai, kp.tgl_selesai, kp.nama_supervisor,
           m.nama_mk, m.kurikulum, km.nama_kategori, m.sks
    FROM kp
    JOIN matakuliah m ON m.id = kp.matakuliah_id
    LEFT JOIN kategori_matakuliah km ON km.id = m.kategori_id
    WHERE kp.id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results[0]);  // Mengembalikan detail KP dan informasi matakuliah terkait
    }
  });
};

// Fungsi untuk memeriksa apakah mahasiswa sudah memiliki data KP
exports.checkMahasiswaHasKP = (mahasiswa_id, callback) => {
  const query = 'SELECT * FROM kp WHERE mahasiswa_id = ?';
  db.query(query, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);  // Mengembalikan true jika sudah ada data KP
    }
  });
};

// Fungsi untuk memeriksa apakah matakuliah yang dipilih adalah kategori "Kerja Praktek"
exports.isMatakuliahKP = (matakuliah_id, callback) => {
  const query = `
    SELECT id FROM matakuliah
    WHERE id = ? AND kategori_id = (SELECT id FROM kategori_matakuliah WHERE nama_kategori = 'Kerja Praktek')
  `;
  db.query(query, [matakuliah_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0); // Mengembalikan true jika matakuliah memiliki kategori "Kerja Praktek"
    }
  });
};

// Fungsi untuk menambahkan data KP dan melulusi mahasiswa ke matakuliah kategori KP
exports.addKP = (mahasiswa_id, tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id, callback) => {
  const query = 'INSERT INTO kp (mahasiswa_id, tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [mahasiswa_id, tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id];
  db.query(query, values, (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      // Menambahkan relasi mahasiswa dengan matakuliah kategori KP
      const queryMatakuliahRelasi = 'INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES (?, ?)';
      db.query(queryMatakuliahRelasi, [mahasiswa_id, matakuliah_id], callback);
    }
  });
};
// Fungsi untuk menghapus data KP dan membatalkan kelulusan mahasiswa dari matakuliah kategori KP
exports.deleteKP = (mahasiswa_id, callback) => {
  const query = 'SELECT matakuliah_id FROM kp WHERE mahasiswa_id = ?';
  db.query(query, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      const matakuliah_id = results[0].matakuliah_id;

      // Menghapus data KP
      const queryDeleteKP = 'DELETE FROM kp WHERE mahasiswa_id = ?';
      db.query(queryDeleteKP, [mahasiswa_id], (err) => {
        if (err) {
          callback(err, null);
        } else {
          // Menghapus relasi antara mahasiswa dan matakuliah kategori KP
          const queryDeleteRelasi = 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?';
          db.query(queryDeleteRelasi, [mahasiswa_id, matakuliah_id], callback);
        }
      });
    }
  });
};