const db = require('../config/db');

// GET semua mahasiswa
exports.getAllMahasiswa = (callback) => {
  const sql = `
    SELECT 
      m.*, 
      d1.nama AS nama_dosen_pa
    FROM mahasiswa m
    LEFT JOIN dosen d1 ON m.dosen_pa_id = d1.id
  `;
  db.query(sql, callback);
};

exports.getMahasiswaFiltered = (filters, callback) => {
  const db = require('../config/db');

  let query = `
    SELECT 
      m.*, 
      d.nama AS nama_dosen_pa,
      IFNULL(s.status, 'belum_proposal') AS status_skripsi
    FROM mahasiswa m
    LEFT JOIN skripsi s ON s.mahasiswa_id = m.id
    LEFT JOIN dosen d ON m.dosen_pa_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.angkatan) {
    query += ' AND m.angkatan = ?';
    params.push(filters.angkatan);
  }

  if (filters.status) {
    query += ' AND m.status = ?';
    params.push(filters.status);
  }

  if (filters.tahap_skripsi) {
    query += ' AND IFNULL(s.status, "belum_proposal") = ?';
    params.push(filters.tahap_skripsi);
  }

  // ⬇ Tambahkan sorting berdasarkan angkatan DESC
  query += ' ORDER BY m.angkatan DESC, m.nama ASC';

  db.query(query, params, callback);
};




// GET detail mahasiswa berdasarkan id
exports.getMahasiswaById = (id, callback) => {
  const sql = `
    SELECT 
      m.*, 
      d1.nama AS nama_dosen_pa
      FROM mahasiswa m
    LEFT JOIN dosen d1 ON m.dosen_pa_id = d1.id
    WHERE m.id = ?
  `;
  db.query(sql, [id], callback);
};


// INSERT mahasiswa baru
exports.createMahasiswa = (data, callback) => {
  const sql = `INSERT INTO mahasiswa (nim, nama, tanggal_lahir, angkatan, alamat, no_telp, no_telp_ortu, dosen_pa_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    data.nim,
    data.nama,
    data.tanggal_lahir || null,
    data.angkatan || null,
    data.alamat || null,
    data.no_telp || null,
    data.no_telp_ortu || null, // Tambahkan no_telp_ortu
    data.dosen_pa_id || null,
  ];
  db.query(sql, values, callback);
};

// UPDATE mahasiswa berdasarkan id
exports.updateMahasiswa = (id, data, callback) => {
  const sql = `UPDATE mahasiswa SET nim = ?, nama = ?, tanggal_lahir = ?, angkatan = ?, alamat = ?, no_telp = ?, no_telp_ortu = ?, dosen_pa_id = ?,status = ? WHERE id = ?`;
  const values = [
    data.nim,
    data.nama,
    data.tanggal_lahir || null,
    data.angkatan || null,
    data.alamat || null,
    data.no_telp || null,
    data.no_telp_ortu || null, // Tambahkan no_telp_ortu
    data.dosen_pa_id || null,
    data.status || 'Belum Lulus',
    id
  ];
  db.query(sql, values, callback);
};


// DELETE mahasiswa berdasarkan id dan hapus data referensi
exports.deleteMahasiswa = (id, callback) => {
  // Pertama ambil nim mahasiswa
  const getNimSql = `SELECT nim FROM mahasiswa WHERE id = ?`;
  db.query(getNimSql, [id], (err, result) => {
    if (err) return callback(err);
    if (result.length === 0) return callback(new Error('Mahasiswa tidak ditemukan'));
    
    const nim = result[0].nim;

    // Delete relasi mahasiswa_matakuliah
    const deleteMMsql = `DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_nim = ?`;
    db.query(deleteMMsql, [nim], (err) => {
      if (err) return callback(err);

      // Delete KP
      const deleteKPsql = `DELETE FROM kp WHERE mahasiswa_nim = ?`;
      db.query(deleteKPsql, [nim], (err) => {
        if (err) return callback(err);

        // Delete Magang
        const deleteMagangSql = `DELETE FROM magang WHERE mahasiswa_nim = ?`;
        db.query(deleteMagangSql, [nim], (err) => {
          if (err) return callback(err);

          // Delete TA
          const deleteTaSql = `DELETE FROM ta WHERE mahasiswa_nim = ?`;
          db.query(deleteTaSql, [nim], (err) => {
            if (err) return callback(err);

            // Terakhir delete mahasiswa
            const deleteMhsSql = `DELETE FROM mahasiswa WHERE id = ?`;
            db.query(deleteMhsSql, [id], callback);
          });
        });
      });
    });
  });
};


// Cek apakah nim sudah ada (untuk create)
exports.isNimExists = (nim, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM mahasiswa WHERE nim = ?`;
  db.query(sql, [nim], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
};

// Cek apakah nim sudah ada selain id tertentu (untuk update)
exports.isNimExistsExcludeId = (nim, id, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM mahasiswa WHERE nim = ? AND id != ?`;
  db.query(sql, [nim, id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
};


// Fungsi untuk mengambil mahasiswa berdasarkan ID
exports.getnameMahasiswaById = (id, callback) => {
  const query = 'SELECT nama FROM mahasiswa WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results[0]);
    }
  });
};





//Untuk KP
exports.getById = (id, callback) => {
  const sql = `
    SELECT 
      m.*, 
      d1.nama AS nama_dosen_pa, 
      d2.nama AS nama_dosen_ta
    FROM mahasiswa m
    LEFT JOIN dosen d1 ON m.dosen_pa_id = d1.id
    LEFT JOIN dosen d2 ON m.dosen_ta_id = d2.id
    WHERE m.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

