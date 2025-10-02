// models/mahasiswaMatakuliahModel.js
const db = require('../config/db'); // Pastikan ini adalah koneksi database Anda



// Fungsi untuk memeriksa apakah beberapa matakuliah sudah diambil oleh mahasiswa ini
exports.checkMatakuliahAlreadyTaken = (mahasiswa_id, matakuliah_ids, callback) => {
  const query = 'SELECT matakuliah_id FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id IN (?)';
  db.query(query, [mahasiswa_id, matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan array matakuliah_id yang sudah ada
    }
  });
};

// Fungsi untuk menambahkan beberapa matakuliah yang sudah dilulusi mahasiswa
exports.addMatakuliahBatch = (mahasiswa_id, matakuliah_ids, callback) => {
  const values = matakuliah_ids.map(matakuliah_id => [mahasiswa_id, matakuliah_id]);
  const query = 'INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES ?';
  
  db.query(query, [values], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};




// Fungsi untuk mengambil daftar matakuliah yang sudah dilulusi oleh mahasiswa beserta SKS, kurikulum, dan kategori
exports.getMatakuliahByMahasiswa = (mahasiswa_id, callback) => {
  const query = `
    SELECT m.id AS matakuliah_id, m.kode_mk, m.nama_mk, m.sks, m.kurikulum, k.nama_kategori
    FROM matakuliah m
    JOIN mahasiswa_matakuliah mm ON mm.matakuliah_id = m.id
    LEFT JOIN kategori_matakuliah k ON k.id = m.kategori_id
    WHERE mm.mahasiswa_id = ?
  `;
  db.query(query, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan ID, nama, SKS, kurikulum, dan kategori matakuliah yang sudah dilulusi
    }
  });
};



// Fungsi untuk menghapus matakuliah dari mahasiswa
exports.removeMatakuliah = (mahasiswa_id, matakuliah_id, callback) => {
  const query = 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?';
  db.query(query, [mahasiswa_id, matakuliah_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};



// Fungsi untuk mendapatkan mata kuliah yang belum diluluskan oleh mahasiswa beserta kurikulum dan kategori
exports.getMatakuliahBelumDilulusi = (mahasiswa_id, callback) => {
  const query = `
    SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.kurikulum, k.nama_kategori
    FROM matakuliah m
    LEFT JOIN mahasiswa_matakuliah mm ON m.id = mm.matakuliah_id AND mm.mahasiswa_id = ?
    LEFT JOIN kategori_matakuliah k ON k.id = m.kategori_id
    WHERE mm.mahasiswa_id IS NULL
  `;
  db.query(query, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      // Hitung total SKS yang belum diluluskan
      const totalSks = results.reduce((total, matakuliah) => total + matakuliah.sks, 0);
      // Menambahkan total SKS ke dalam response
      callback(null, { matakuliah: results, total_sks: totalSks });
    }
  });
};


//Melihat list matakuliah yang belum dilulusi mahasiswa filtered by kategori dan kurikulum
exports.getMatakuliahBelumDilulusiFiltered = (mahasiswa_id, filters, callback) => {
  const db = require('../config/db');

  let query = `
    SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.kurikulum, k.nama_kategori
    FROM matakuliah m
    LEFT JOIN mahasiswa_matakuliah mm 
      ON m.id = mm.matakuliah_id AND mm.mahasiswa_id = ?
    LEFT JOIN kategori_matakuliah k ON k.id = m.kategori_id
    WHERE mm.mahasiswa_id IS NULL
  `;
  const params = [mahasiswa_id];

  if (filters.kategori_id) {
    query += ' AND m.kategori_id = ?';
    params.push(filters.kategori_id);
  }

  if (filters.kurikulum) {
    query += ' AND m.kurikulum = ?';
    params.push(filters.kurikulum);
  }

  db.query(query, params, (err, results) => {
    if (err) return callback(err);

    const totalSks = results.reduce((total, mk) => total + mk.sks, 0);
    callback(null, { matakuliah: results, total_sks: totalSks });
  });
};




//Untuk KP
// Fungsi untuk menghapus matakuliah kategori KP dari mahasiswa
exports.removeMatakuliahKPFromMahasiswa = (mahasiswa_id, matakuliah_id, callback) => {
  const query = 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?';
  db.query(query, [mahasiswa_id, matakuliah_id], callback);
};

// models/mahasiswaMatakuliahModel.js

// Fungsi untuk memeriksa apakah matakuliah memiliki kategori yang dibatasi (Kerja Praktek, Seminar Hasil, Skripsi)
exports.isMatakuliahKategoriTertentu = (matakuliah_id, callback) => {
  const query = 'SELECT kategori_id FROM matakuliah WHERE id = ?';
  db.query(query, [matakuliah_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      if (results.length > 0) {
        const kategori_id = results[0].kategori_id;
        // Kategori 3 (Kerja Praktek), 4 (Seminar Hasil), 5 (Skripsi)
        if ([3, 4, 5].includes(kategori_id)) {
          callback(null, true);  // Kategori yang dibatasi
        } else {
          callback(null, false); // Kategori lain
        }
      } else {
        callback(null, false);  // Matakuliah tidak ditemukan
      }
    }
  });
};
