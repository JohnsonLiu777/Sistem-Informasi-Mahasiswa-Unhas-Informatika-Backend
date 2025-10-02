// models/matakuliahModel.js
const db = require('../config/db'); // Pastikan ini adalah koneksi database Anda

// Fungsi untuk mengambil semua matakuliah beserta nama kategori
exports.getAllMatakuliah = (callback) => {
  const query = `
    SELECT 
      matakuliah.id, 
      matakuliah.kode_mk, 
      matakuliah.nama_mk, 
      matakuliah.sks, 
      matakuliah.kurikulum,
      kategori_matakuliah.nama_kategori
    FROM matakuliah 
    LEFT JOIN kategori_matakuliah 
      ON matakuliah.kategori_id = kategori_matakuliah.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

//Fungsi untuk mendapatkan list matakuliah filter by kategori dan kurikulum
exports.getFilteredMatakuliah = (filters, callback) => {
  const db = require('../config/db');

  let query = `
    SELECT 
      m.id,
      m.kode_mk,
      m.nama_mk,
      m.sks,
      m.kurikulum,
      k.nama_kategori AS nama_kategori
    FROM matakuliah m
    LEFT JOIN kategori_matakuliah k ON m.kategori_id = k.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.kategori_id) {
    query += ' AND m.kategori_id = ?';
    params.push(filters.kategori_id);
  }

  if (filters.kurikulum) {
    query += ' AND m.kurikulum = ?';
    params.push(filters.kurikulum);
  }

  query += ' ORDER BY m.nama_mk ASC';

  db.query(query, params, callback);
};


// Fungsi untuk mengambil detail matakuliah berdasarkan id
exports.getMatakuliahById = (id, callback) => {
  const query = `
    SELECT 
      matakuliah.id, 
      matakuliah.kode_mk, 
      matakuliah.nama_mk, 
      matakuliah.sks, 
      matakuliah.kurikulum, 
      kategori_matakuliah.nama_kategori
    FROM matakuliah 
    LEFT JOIN kategori_matakuliah 
      ON matakuliah.kategori_id = kategori_matakuliah.id
    WHERE matakuliah.id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      if (results.length > 0) {
        callback(null, results[0]); // Mengembalikan detail matakuliah berdasarkan ID
      } else {
        callback(null, null); // Tidak ditemukan
      }
    }
  });
};

// Fungsi untuk mengecek apakah kode_mk sudah ada
exports.isKodeMkExists = (kode_mk, callback) => {
  const query = 'SELECT id FROM matakuliah WHERE kode_mk = ?';
  db.query(query, [kode_mk], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);
    }
  });
};

// Fungsi untuk mengecek apakah kategori_id ada di tabel kategori_matakuliah
exports.isKategoriExists = (kategori_id, callback) => {
  const query = 'SELECT id FROM kategori_matakuliah WHERE id = ?';
  db.query(query, [kategori_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);
    }
  });
};


// Fungsi untuk mengecek apakah kode_mk sudah ada, kecuali untuk matakuliah yang sedang diupdate
exports.isKodeMkExistsExcludeId = (kode_mk, id, callback) => {
  const query = 'SELECT id FROM matakuliah WHERE kode_mk = ? AND id != ?';
  db.query(query, [kode_mk, id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);
    }
  });
};

// Menambah matakuliah baru dengan kategori_id
exports.createMatakuliah = (data, callback) => {
  const { kode_mk, nama_mk, sks, kurikulum, kategori_id } = data;  // Ambil kategori_id dari data
  const query = 'INSERT INTO matakuliah (kode_mk, nama_mk, sks, kurikulum, kategori_id) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [kode_mk, nama_mk, sks, kurikulum, kategori_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};



// Mengupdate matakuliah berdasarkan id, termasuk kategori_id
exports.updateMatakuliah = (id, data, callback) => {
  const { kode_mk, nama_mk, sks, kurikulum, kategori_id } = data;  // Ambil kategori_id dari data
  const query = 'UPDATE matakuliah SET kode_mk = ?, nama_mk = ?, sks = ?, kurikulum = ?, kategori_id = ? WHERE id = ?';
  db.query(query, [kode_mk, nama_mk, sks, kurikulum, kategori_id, id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};


// Fungsi untuk menghapus matakuliah dan data terkait
exports.deleteMatakuliah = (id, callback) => {
  // Menghapus data di tabel yang berhubungan (misalnya mahasiswa_matakuliah)
  const deleteQuery = 'DELETE FROM matakuliah WHERE id = ?';
  db.query(deleteQuery, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Fungsi untuk memeriksa apakah matakuliah ada di dalam database
exports.checkMatakuliahExists = (matakuliah_ids, callback) => {
  const query = 'SELECT id FROM matakuliah WHERE id IN (?)';
  db.query(query, [matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      const existingIds = results.map(result => result.id); // List of existing matakuliah_ids
      callback(null, existingIds);  // Mengembalikan ID matakuliah yang valid
    }
  });
};

// Fungsi untuk mengambil matakuliah berdasarkan ID
exports.getMatakuliahByIds = (ids, callback) => {
  const query = 'SELECT id, kode_mk, nama_mk, sks, kurikulum, kategori_id FROM matakuliah WHERE id IN (?)';
  db.query(query, [ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};



// Fungsi untuk mengambil matakuliah berdasarkan tahun kurikulum, termasuk kategori matakuliah
exports.getMatakuliahByKurikulum = (kurikulum, callback) => {
  const query = `
    SELECT 
      matakuliah.id, 
      matakuliah.kode_mk, 
      matakuliah.nama_mk, 
      matakuliah.sks, 
      matakuliah.kurikulum,  
      kategori_matakuliah.nama_kategori 
    FROM matakuliah 
    LEFT JOIN kategori_matakuliah 
      ON matakuliah.kategori_id = kategori_matakuliah.id
    WHERE matakuliah.kurikulum = ?
  `;
  db.query(query, [kurikulum], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};






//UNTUK KP
// Fungsi ambil matkul by kode mk (callback)
exports.getByKode = (kode_mk, callback) => {
  const sql = 'SELECT * FROM matakuliah WHERE kode_mk = ?';
  db.query(sql, [kode_mk], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// Fungsi cek apakah mahasiswa sudah punya matkul tertentu (callback)
exports.checkMahasiswaMatkul = (mahasiswa_id, matkul_id, callback) => {
  const sql = 'SELECT * FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?';
  db.query(sql, [mahasiswa_id, matkul_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
};

// Fungsi tambah relasi mahasiswa dan matkul (callback)
exports.addMahasiswaMatkul = (mahasiswa_id, matkul_id, callback) => {
  const sql = 'INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES (?, ?)';
  db.query(sql, [mahasiswa_id, matkul_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};


// Fungsi untuk mengambil matakuliah berdasarkan ID
exports.getById = (id, callback) => {
  const query = 'SELECT id, kode_mk, nama_mk, sks FROM matakuliah WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results[0]); // Mengembalikan matakuliah berdasarkan ID
    }
  });
};

// Fungsi untuk memeriksa apakah matakuliah sudah digunakan untuk detail KP
exports.isMatakuliahUsedInKP = (matakuliah_id, callback) => {
  const query = 'SELECT id FROM kp WHERE matakuliah_id = ?';
  db.query(query, [matakuliah_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0); // Jika ada data KP yang menggunakan matakuliah ini
  });
};


// Cek apakah matakuliah sudah digunakan dalam tahap seminar hasil atau tutup
exports.isMatakuliahUsedInSkripsiTahap = (matakuliah_id, callback) => {
  const query = `
    SELECT id FROM skripsi_tahap
    WHERE matakuliah_id = ? AND tahap IN ('hasil', 'tutup')
  `;
  db.query(query, [matakuliah_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
};


exports.isMatakuliahInUse = (matakuliah_id, callback) => {
  const sql = `
    SELECT COUNT(*) AS total FROM (
      SELECT matakuliah_id FROM mahasiswa_matakuliah WHERE matakuliah_id = ?
      UNION
      SELECT matakuliah_id FROM skripsi_tahap WHERE matakuliah_id = ?
      UNION
      SELECT matakuliah_id FROM kp WHERE matakuliah_id = ?
      UNION
      SELECT matakuliah_id FROM matakuliah_magang WHERE matakuliah_id = ?
    ) AS usage_check
  `;
  db.query(sql, [matakuliah_id, matakuliah_id, matakuliah_id, matakuliah_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].total > 0);
  });
};
