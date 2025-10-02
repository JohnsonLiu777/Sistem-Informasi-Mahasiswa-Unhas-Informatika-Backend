// models/dosenModel.js
const db = require('../config/db'); // Pastikan ini adalah koneksi database Anda

// Fungsi untuk mengambil semua dosen
exports.getAllDosen = (callback) => {
  const query = 'SELECT id, nip, nama FROM dosen';
  db.query(query, (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Fungsi untuk mengecek apakah NIP sudah ada
exports.isNipExists = (nip, callback) => {
  const query = 'SELECT id FROM dosen WHERE nip = ?';
  db.query(query, [nip], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);
    }
  });
};

// Fungsi untuk mengecek apakah NIP sudah ada, kecuali untuk dosen yang sedang diupdate
exports.isNipExistsExcludeId = (nip, id, callback) => {
  const query = 'SELECT id FROM dosen WHERE nip = ? AND id != ?';
  db.query(query, [nip, id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results.length > 0);
    }
  });
};

// Fungsi untuk menambah dosen baru
exports.createDosen = (data, callback) => {
  const { nip, nama } = data;
  const query = 'INSERT INTO dosen (nip, nama) VALUES (?, ?)';
  db.query(query, [nip, nama], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Fungsi untuk mengupdate dosen berdasarkan id
exports.updateDosen = (id, data, callback) => {
  const { nip, nama } = data;
  const query = 'UPDATE dosen SET nip = ?, nama = ? WHERE id = ?';
  db.query(query, [nip, nama, id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};
// Fungsi untuk menghapus dosen jika tidak digunakan di tabel lain
exports.deleteDosen = (id, callback) => {
  // Cek apakah dosen ada
  const checkDosenSql = 'SELECT * FROM dosen WHERE id = ?';
  db.query(checkDosenSql, [id], (errExist, resultExist) => {
    if (errExist) return callback(errExist, null);
    if (resultExist.length === 0) {
      const error = new Error("Dosen dengan ID tersebut tidak ditemukan");
      return callback(error, null);
    }

    // Cek relasi di semua tabel yang terhubung
    const checkRelations = `
      SELECT 
        (SELECT COUNT(*) FROM mahasiswa WHERE dosen_pa_id = ?) AS mhs_pa,
        (SELECT COUNT(*) FROM skripsi_tahap WHERE dosen_pembimbing_id = ?) AS skripsi_bimbing,
        (SELECT COUNT(*) FROM skripsi_tahap WHERE dosen_penguji_1_id = ?) AS penguji_1,
        (SELECT COUNT(*) FROM skripsi_tahap WHERE dosen_penguji_2_id = ?) AS penguji_2,
        (SELECT COUNT(*) FROM kp WHERE dosen_pembimbing_kp_id = ?) AS kp_bimbing
    `;

    db.query(checkRelations, [id, id, id, id, id], (errCheck, resultCheck) => {
      if (errCheck) return callback(errCheck, null);

      const relasi = resultCheck[0];
      const totalRelasi = relasi.mhs_pa + relasi.skripsi_bimbing + relasi.penguji_1 + relasi.penguji_2 + relasi.kp_bimbing;

      if (totalRelasi > 0) {
        const error = new Error("Dosen tidak dapat dihapus karena masih digunakan di tabel lain");
        return callback(error, null);
      }

      // Hapus akun user dosen
      const deleteUserSql = 'DELETE FROM users WHERE dosen_id = ?';
      db.query(deleteUserSql, [id], (errUser) => {
        if (errUser) return callback(errUser, null);

        // Hapus dari tabel dosen
        const deleteDosenSql = 'DELETE FROM dosen WHERE id = ?';
        db.query(deleteDosenSql, [id], (errDelete, resultDelete) => {
          if (errDelete) return callback(errDelete, null);
          callback(null, resultDelete);
        });
      });
    });
  });
};




// Fungsi untuk ambil dosen berdasarkan ID

// Helper untuk query berbasis Promise
const q = (sql, params=[]) =>
  new Promise((resolve, reject) => db.query(sql, params, (e, r) => e ? reject(e) : resolve(r)));

exports.getById = (id, callback) => {
  const sql = 'SELECT * FROM dosen WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);  // Ambil data dosen pertama (atau null kalau gak ada)
  });
};

// subquery reusable untuk mengambil tahap terakhir per skripsi
const LATEST_TAHAP_JOIN = `
JOIN skripsi s ON s.mahasiswa_id = m.id
JOIN skripsi_tahap lt ON lt.skripsi_id = s.id
 AND lt.id = (
   SELECT st2.id
   FROM skripsi_tahap st2
   WHERE st2.skripsi_id = s.id
   ORDER BY (st2.tanggal IS NULL) ASC, st2.tanggal DESC, st2.id DESC
   LIMIT 1
 )
`;

exports.getDosenDetailFull = async (dosenId) => {
  // profil + akun (role dosen)
  const [profil] = await q(`
    SELECT d.id, d.nip, d.nama, u.username, u.password
    FROM dosen d
    LEFT JOIN users u ON u.dosen_id = d.id AND u.role = 'dosen'
    WHERE d.id = ?
    LIMIT 1
  `, [dosenId]);

  if (!profil) return null;

  // === 1) BIMBINGAN PA ===
  // shape mahasiswa standar + nama_dosen_pa + status_skripsi
  const bimbinganPA = await q(`
    SELECT 
      m.id, m.nim, m.nama, m.tanggal_lahir, m.angkatan, 
      m.no_telp, m.no_telp_ortu, m.alamat, m.dosen_pa_id, m.status,
      d.nama AS nama_dosen_pa,
      IFNULL(s.status, 'belum_proposal') AS status_skripsi
    FROM mahasiswa m
    LEFT JOIN dosen d ON d.id = m.dosen_pa_id
    LEFT JOIN skripsi s ON s.mahasiswa_id = m.id
    WHERE m.dosen_pa_id = ?
    ORDER BY m.angkatan DESC, m.nama ASC
  `, [dosenId]);

  // === 2) BIMBINGAN SKRIPSI (sebagai pembimbing, pada tahap terakhir) ===
  const bimbinganSkripsi = await q(`
    SELECT DISTINCT
      m.id, m.nim, m.nama, m.tanggal_lahir, m.angkatan, 
      m.no_telp, m.no_telp_ortu, m.alamat, m.dosen_pa_id, m.status,
      d.nama AS nama_dosen_pa,
      IFNULL(s.status, 'belum_proposal') AS status_skripsi
    FROM mahasiswa m
    LEFT JOIN dosen d ON d.id = m.dosen_pa_id
    ${LATEST_TAHAP_JOIN}
    WHERE lt.dosen_pembimbing_id = ?
    ORDER BY m.angkatan DESC, m.nama ASC
  `, [dosenId]);

  // === 3) MAHASISWA DIUJI (sebagai penguji 1/2, pada tahap terakhir) ===
  const mahasiswaDiuji = await q(`
    SELECT DISTINCT
      m.id, m.nim, m.nama, m.tanggal_lahir, m.angkatan, 
      m.no_telp, m.no_telp_ortu, m.alamat, m.dosen_pa_id, m.status,
      d.nama AS nama_dosen_pa,
      IFNULL(s.status, 'belum_proposal') AS status_skripsi
    FROM mahasiswa m
    LEFT JOIN dosen d ON d.id = m.dosen_pa_id
    ${LATEST_TAHAP_JOIN}
    WHERE lt.dosen_penguji_1_id = ? OR lt.dosen_penguji_2_id = ?
    ORDER BY m.angkatan DESC, m.nama ASC
  `, [dosenId, dosenId]);

  return {
    dosen: profil,             // { id, nip, nama, username, password }
    bimbingan_pa: bimbinganPA, // array of mahasiswa with the requested shape
    bimbingan_skripsi: bimbinganSkripsi,
    mahasiswa_diuji: mahasiswaDiuji
  };
};

//Statistik Dosen.
exports.getStatistikPerDosenPerAngkatan = (opts, cb) => {
  const db = require('../config/db');
  const { from, to } = opts || {};
  const params = [];
  let filterAngkatan = '';
  if (from) { filterAngkatan += ' AND m.angkatan >= ?'; params.push(from); }
  if (to)   { filterAngkatan += ' AND m.angkatan <= ?'; params.push(to); }

  const sql = `
    SELECT 
      d.id AS dosen_id, d.nama AS nama_dosen, t.tahun,
      SUM(t.bimbingan_pa) AS bimbingan_pa,
      SUM(t.bimbingan_ta) AS bimbingan_ta,
      SUM(t.mahasiswa_diuji) AS mahasiswa_diuji
    FROM dosen d
    LEFT JOIN (
      SELECT m.dosen_pa_id AS dosen_id, m.angkatan AS tahun,
             COUNT(*) AS bimbingan_pa, 0 AS bimbingan_ta, 0 AS mahasiswa_diuji
      FROM mahasiswa m
      WHERE m.dosen_pa_id IS NOT NULL ${filterAngkatan}
      GROUP BY m.dosen_pa_id, m.angkatan

      UNION ALL
      SELECT st.dosen_pembimbing_id, m.angkatan,
             0, COUNT(DISTINCT s.mahasiswa_id), 0
      FROM skripsi_tahap st
      JOIN skripsi s ON s.id = st.skripsi_id
      JOIN mahasiswa m ON m.id = s.mahasiswa_id
      WHERE st.dosen_pembimbing_id IS NOT NULL ${filterAngkatan}
      GROUP BY st.dosen_pembimbing_id, m.angkatan

      UNION ALL
      SELECT st.dosen_penguji_1_id, m.angkatan,
             0, 0, COUNT(DISTINCT s.mahasiswa_id)
      FROM skripsi_tahap st
      JOIN skripsi s ON s.id = st.skripsi_id
      JOIN mahasiswa m ON m.id = s.mahasiswa_id
      WHERE st.dosen_penguji_1_id IS NOT NULL ${filterAngkatan}
      GROUP BY st.dosen_penguji_1_id, m.angkatan

      UNION ALL
      SELECT st.dosen_penguji_2_id, m.angkatan,
             0, 0, COUNT(DISTINCT s.mahasiswa_id)
      FROM skripsi_tahap st
      JOIN skripsi s ON s.id = st.skripsi_id
      JOIN mahasiswa m ON m.id = s.mahasiswa_id
      WHERE st.dosen_penguji_2_id IS NOT NULL ${filterAngkatan}
      GROUP BY st.dosen_penguji_2_id, m.angkatan
    ) t ON t.dosen_id = d.id
    GROUP BY d.id, d.nama, t.tahun
    HAVING (bimbingan_pa + bimbingan_ta + mahasiswa_diuji) > 0
    ORDER BY d.id ASC, t.tahun DESC
  `;
  db.query(sql, params.concat(params, params, params), cb);
};




//Dashboard Dosen

exports.getMahasiswaBimbinganPAWithMatkul = (req, res) => {
  const dosenId = req.user.dosen_id;

  if (!dosenId) {
    return res.status(403).json({ message: "Akses hanya untuk dosen" });
  }

  // Ambil data mahasiswa bimbingan PA
  const sqlMhs = `
    SELECT id, nim, nama, angkatan, tanggal_lahir, no_telp, no_telp_ortu, alamat
    FROM mahasiswa
    WHERE dosen_pa_id = ?
  `;

  db.query(sqlMhs, [dosenId], (errMhs, mhsList) => {
    if (errMhs) return res.status(500).json({ message: "Gagal ambil data mahasiswa", error: errMhs });

    if (mhsList.length === 0) {
      return res.json({ message: "Tidak ada mahasiswa bimbingan PA", data: [] });
    }

    // Ambil semua matakuliah untuk mahasiswa tersebut
    const mhsIds = mhsList.map(m => m.id);
    const sqlMatkul = `
      SELECT 
        m.id AS mahasiswa_id,
        mk.kode_mk, mk.nama_mk, mk.sks
      FROM mahasiswa m
      JOIN mahasiswa_matakuliah mmk ON m.id = mmk.mahasiswa_id
      JOIN matakuliah mk ON mmk.matakuliah_id = mk.id
      WHERE m.id IN (?)
    `;

    db.query(sqlMatkul, [mhsIds], (errMatkul, matkulList) => {
      if (errMatkul) return res.status(500).json({ message: "Gagal ambil matakuliah", error: errMatkul });

      // Gabungkan data
      const hasil = mhsList.map(mhs => {
        const matakuliah_lulus = matkulList.filter(mk => mk.mahasiswa_id === mhs.id);
        const total_sks = matakuliah_lulus.reduce((sum, mk) => sum + mk.sks, 0);

        return {
          ...mhs,
          matakuliah_lulus,
          total_sks
        };
      });

      res.json({ message: "Data mahasiswa bimbingan PA berhasil diambil", data: hasil });
    });
  });
};