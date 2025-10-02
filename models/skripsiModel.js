const db = require('../config/db');

// Cek atau buat skripsi
exports.createOrGetSkripsi = (mahasiswa_id, callback) => {
  const qCheck = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qCheck, [mahasiswa_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) {
      return callback(null, rows[0].id);
    }
    // Belum ada, insert
    const qInsert = `
      INSERT INTO skripsi (mahasiswa_id, status)
      VALUES (?, 'sudah_proposal')
    `;
    db.query(qInsert, [mahasiswa_id], (err, result) => {
      if (err) return callback(err);
      return callback(null, result.insertId);
    });
  });
};


//TAHAP PROPOSAL

// Tambah tahap proposal
exports.addTahapProposal = (skripsi_id, data, callback) => {
  const qCheck = `
    SELECT id FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'proposal'
  `;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) {
      return callback(new Error('Data seminar proposal sudah ada.'));
    }

    const qInsert = `
      INSERT INTO skripsi_tahap
      (skripsi_id, tahap, judul, tanggal, dosen_pembimbing_id, dosen_penguji_1_id, dosen_penguji_2_id)
      VALUES (?, 'proposal', ?, ?, ?, ?, ?)
    `;
    const vals = [
      skripsi_id,
      data.judul,
      data.tanggal,
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id
    ];
    db.query(qInsert, vals, (err) => {
      if (err) return callback(err);

      // Update status skripsi
      const qUpdate = 'UPDATE skripsi SET status = "sudah_proposal" WHERE id = ?';
      db.query(qUpdate, [skripsi_id], callback);
    });
  });
};

// Get tahap proposal
exports.getTahapProposal = (skripsi_id, callback) => {
  const q = `
    SELECT
      st.*,
      dp.nama AS nama_pembimbing,
      d1.nama AS nama_penguji_1,
      d2.nama AS nama_penguji_2
    FROM skripsi_tahap st
    LEFT JOIN dosen dp ON dp.id = st.dosen_pembimbing_id
    LEFT JOIN dosen d1 ON d1.id = st.dosen_penguji_1_id
    LEFT JOIN dosen d2 ON d2.id = st.dosen_penguji_2_id
    WHERE st.skripsi_id = ? AND st.tahap = 'proposal'
  `;
  db.query(q, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(null, null);
    callback(null, rows[0]);
  });
};


// Update tahap proposal
exports.updateTahapProposal = (skripsi_id, data, callback) => {
  const qCheck = `
    SELECT id FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'proposal'
  `;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) {
      return callback(new Error('Data seminar proposal belum ada.'));
    }

    const qUpdate = `
      UPDATE skripsi_tahap
      SET judul = ?, tanggal = ?, dosen_pembimbing_id = ?, dosen_penguji_1_id = ?, dosen_penguji_2_id = ?
      WHERE skripsi_id = ? AND tahap = 'proposal'
    `;
    const vals = [
      data.judul,
      data.tanggal,
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id,
      skripsi_id
    ];
    db.query(qUpdate, vals, callback);
  });
};

// Delete tahap proposal
exports.deleteTahapProposal = (skripsi_id, callback) => {
  const qCheck = `
    SELECT id FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'proposal'
  `;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) {
      return callback(new Error('Data seminar proposal tidak ditemukan.'));
    }

    const qDelete = `
      DELETE FROM skripsi_tahap
      WHERE skripsi_id = ? AND tahap = 'proposal'
    `;
    db.query(qDelete, [skripsi_id], (err) => {
      if (err) return callback(err);

      // Kembalikan status skripsi
      const qUpdate = 'UPDATE skripsi SET status = "belum_proposal" WHERE id = ?';
      db.query(qUpdate, [skripsi_id], callback);
    });
  });
};



//Tahap Seminar Hasil
exports.addTahapHasil = (skripsi_id, data, mahasiswa_id, callback) => {
  const db = require('../config/db');

  // 1. Cek apakah sudah ada data hasil
  const qCheck = `
    SELECT id FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'hasil'
  `;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) {
      return callback(new Error('Data seminar hasil sudah ada.'));
    }

    // 2. Insert skripsi_tahap
    const qInsert = `
      INSERT INTO skripsi_tahap
      (skripsi_id, tahap, judul, tanggal, dosen_pembimbing_id, dosen_penguji_1_id, dosen_penguji_2_id, matakuliah_id)
      VALUES (?, 'hasil', ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      skripsi_id,
      data.judul,
      data.tanggal,
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id,
      data.matakuliah_id
    ];
    db.query(qInsert, vals, (err) => {
      if (err) return callback(err);

      // 3. Insert matakuliah kelulusan
      const qMatkul = `
        INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id)
        VALUES (?, ?)
      `;
      db.query(qMatkul, [mahasiswa_id, data.matakuliah_id], (err) => {
        if (err) return callback(err);

        // 4. Update status skripsi
        const qUpdateStatus = `
          UPDATE skripsi SET status = 'sudah_hasil' WHERE id = ?
        `;
        db.query(qUpdateStatus, [skripsi_id], callback);
      });
    });
  });
};


exports.getTahapHasil = (skripsi_id, callback) => {
  const q = `
    SELECT
      st.*,
      dp.nama AS nama_pembimbing,
      dp.nip AS nip_pembimbing,
      d1.nama AS nama_penguji_1,
      d1.nip AS nip_penguji_1,
      d2.nama AS nama_penguji_2,
      d2.nip AS nip_penguji_2,
      m.nama_mk AS nama_matakuliah,
      m.kode_mk,
      m.kurikulum,
      m.sks
    FROM skripsi_tahap st
    LEFT JOIN dosen dp ON dp.id = st.dosen_pembimbing_id
    LEFT JOIN dosen d1 ON d1.id = st.dosen_penguji_1_id
    LEFT JOIN dosen d2 ON d2.id = st.dosen_penguji_2_id
    LEFT JOIN matakuliah m ON m.id = st.matakuliah_id
    WHERE st.skripsi_id = ? AND st.tahap = 'hasil'
  `;
  db.query(q, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(null, null);
    callback(null, rows[0]);
  });
};


exports.updateTahapHasil = (skripsi_id, data, callback) => {
  const qCheck = `
    SELECT id FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'hasil'
  `;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) {
      return callback(new Error('Data seminar hasil belum ada.'));
    }

    const qUpdate = `
      UPDATE skripsi_tahap
      SET judul = ?, tanggal = ?, dosen_pembimbing_id = ?, dosen_penguji_1_id = ?, dosen_penguji_2_id = ?, matakuliah_id = ?
      WHERE skripsi_id = ? AND tahap = 'hasil'
    `;
    const vals = [
      data.judul,
      data.tanggal,
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id,
      data.matakuliah_id,
      skripsi_id
    ];
    db.query(qUpdate, vals, callback);
  });
};

exports.deleteTahapHasil = (skripsi_id, mahasiswa_id, matakuliah_id, callback) => {
  const db = require('../config/db');

  const qDelete = `
    DELETE FROM skripsi_tahap
    WHERE skripsi_id = ? AND tahap = 'hasil'
  `;
  db.query(qDelete, [skripsi_id], (err) => {
    if (err) return callback(err);

    // Hapus matakuliah kelulusan
    const qDelMatkul = `
      DELETE FROM mahasiswa_matakuliah
      WHERE mahasiswa_id = ? AND matakuliah_id = ?
    `;
    db.query(qDelMatkul, [mahasiswa_id, matakuliah_id], (err) => {
      if (err) return callback(err);

      // Update status skripsi
      const qUpdateStatus = `
        UPDATE skripsi SET status = 'sudah_proposal' WHERE id = ?
      `;
      db.query(qUpdateStatus, [skripsi_id], callback);
    });
  });
};


//Tahap Seminar Tutup
// ✅ Tambah Tahap Seminar Tutup
exports.addTahapTutup = (skripsi_id, data, mahasiswa_id, callback) => {
  const qCheck = `SELECT id FROM skripsi_tahap WHERE skripsi_id = ? AND tahap = 'tutup'`;
  db.query(qCheck, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) return callback(new Error('Data seminar tutup sudah ada.'));

    const qInsert = `
      INSERT INTO skripsi_tahap
      (skripsi_id, tahap, judul, tanggal, dosen_pembimbing_id, dosen_penguji_1_id, dosen_penguji_2_id, matakuliah_id)
      VALUES (?, 'tutup', ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      skripsi_id,
      data.judul,
      data.tanggal,
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id,
      data.matakuliah_id
    ];
    db.query(qInsert, vals, (err) => {
      if (err) return callback(err);

      // Tambahkan matakuliah kelulusan
      const qMatkul = `INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES (?, ?)`;
      db.query(qMatkul, [mahasiswa_id, data.matakuliah_id], (err) => {
        if (err) return callback(err);

        const qUpdate = `UPDATE skripsi SET status = 'sudah_tutup' WHERE id = ?`;
        db.query(qUpdate, [skripsi_id], callback);
      });
    });
  });
};

// ✅ Get Tahap Seminar Tutup
exports.getTahapTutup = (skripsi_id, callback) => {
  const q = `
    SELECT st.*, 
    dp.nama AS nama_pembimbing,
    dp.nip AS nip_pembimbing,
    d1.nama AS nama_penguji_1,
    d1.nip AS nip_penguji_1,
    d2.nama AS nama_penguji_2,
    d2.nip AS nip_penguji_2,
    m.nama_mk AS nama_matakuliah,
      m.kode_mk,
      m.kurikulum,
      m.sks

    FROM skripsi_tahap st
    LEFT JOIN dosen dp ON dp.id = st.dosen_pembimbing_id
    LEFT JOIN dosen d1 ON d1.id = st.dosen_penguji_1_id
    LEFT JOIN dosen d2 ON d2.id = st.dosen_penguji_2_id
    LEFT JOIN matakuliah m ON m.id = st.matakuliah_id
    WHERE st.skripsi_id = ? AND st.tahap = 'tutup'
  `;
  db.query(q, [skripsi_id], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(null, null);
    callback(null, rows[0]);
  });
};

// ✅ Update Tahap Seminar Tutup
exports.updateTahapTutup = (skripsi_id, data, callback) => {
  const q = `
    UPDATE skripsi_tahap
    SET judul = ?, tanggal = ?, dosen_pembimbing_id = ?, dosen_penguji_1_id = ?, dosen_penguji_2_id = ?, matakuliah_id = ?
    WHERE skripsi_id = ? AND tahap = 'tutup'
  `;
  const vals = [
    data.judul,
    data.tanggal,
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id,
    data.matakuliah_id,
    skripsi_id
  ];
  db.query(q, vals, callback);
};

// ✅ Delete Tahap Seminar Tutup
exports.deleteTahapTutup = (skripsi_id, mahasiswa_id, matakuliah_id, callback) => {
  const qDel = `DELETE FROM skripsi_tahap WHERE skripsi_id = ? AND tahap = 'tutup'`;
  db.query(qDel, [skripsi_id], (err) => {
    if (err) return callback(err);

    const qDelMK = `DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?`;
    db.query(qDelMK, [mahasiswa_id, matakuliah_id], (err) => {
      if (err) return callback(err);

      const qUpdate = `UPDATE skripsi SET status = 'sudah_hasil' WHERE id = ?`;
      db.query(qUpdate, [skripsi_id], callback);
    });
  });
};