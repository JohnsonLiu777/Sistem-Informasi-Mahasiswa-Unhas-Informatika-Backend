const KategoriMatakuliah = require('../models/kategoriMatakuliahModel');
const db = require('../config/db');

// Mendapatkan semua kategori matakuliah
exports.getAllKategoriMatakuliah = (req, res) => {
  KategoriMatakuliah.getAllKategoriMatakuliah((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Menambahkan kategori matakuliah baru
exports.createKategoriMatakuliah = (req, res) => {
  const { nama_kategori, detail } = req.body;

  // Validasi input
  if (!nama_kategori || !detail) {
    return res.status(400).json({ error: 'Nama dan detail Kategori harus diisi' });
  }

  // Periksa apakah nama kategori sudah ada
  KategoriMatakuliah.isNamaMatakuliahExists(nama_kategori, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'Nama Kategori sudah digunakan, harus unik' });

    // Menambah kategori matakuliah baru jika nama kategori tidak ada
    const kategoriData = { nama_kategori, detail };
    KategoriMatakuliah.createKategoriMatakuliah(kategoriData, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Kategori Matakuliah berhasil ditambahkan', data: kategoriData });
    });
  });
};

// Kategori yang tidak dapat diubah atau dihapus
const protectedKategoriIds = [3, 4, 5]; // ID untuk "Kerja Praktek", "Seminar Hasil", "Skripsi"



// Update kategori matakuliah
exports.updateKategoriMatakuliah = (req, res) => {
  const { id } = req.params;
  const { nama_kategori, detail } = req.body;
  const db = require('../config/db');
  const KategoriMatakuliah = require('../models/kategoriMatakuliahModel'); // asumsi nama model

  // Validasi input
  if (!nama_kategori || !detail) {
    return res.status(400).json({ error: 'Nama Kategori dan Detail harus diisi.' });
  }

  const kategoriId = Number(id);
  if (Number.isNaN(kategoriId)) {
    return res.status(400).json({ error: 'Parameter id tidak valid.' });
  }

  // 1) Cek apakah kategori dengan id tsb ada
  const checkExistSql = 'SELECT 1 FROM kategori_matakuliah WHERE id = ? LIMIT 1';
  db.query(checkExistSql, [kategoriId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    }

    // 2) Proteksi kategori tertentu (jika ada aturan)
    if (protectedKategoriIds.includes(kategoriId)) {
      return res.status(400).json({ error: 'Kategori ini tidak dapat diubah karena digunakan dalam relasi sistem penting.' });
    }

    // 3) Cek apakah kategori sudah dipakai matakuliah aktif
    const checkUsageQuery = `
      SELECT m.id FROM matakuliah m
      LEFT JOIN mahasiswa_matakuliah mm ON mm.matakuliah_id = m.id
      LEFT JOIN skripsi_tahap st ON st.matakuliah_id = m.id
      LEFT JOIN kp ON kp.matakuliah_id = m.id
      LEFT JOIN matakuliah_magang mg ON mg.matakuliah_id = m.id
      WHERE m.kategori_id = ? AND (
        mm.matakuliah_id IS NOT NULL OR
        st.matakuliah_id IS NOT NULL OR
        kp.matakuliah_id IS NOT NULL OR
        mg.matakuliah_id IS NOT NULL
      )
    `;
    db.query(checkUsageQuery, [kategoriId], (err2, usedRows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      if (usedRows.length > 0) {
        return res.status(400).json({
          error: 'Kategori ini tidak dapat diubah karena sudah digunakan oleh matakuliah yang aktif dalam sistem.'
        });
      }

      // 4) Validasi nama unik (exclude id sendiri)
      KategoriMatakuliah.isNamaMatakuliahExistsExcludeId(nama_kategori, kategoriId, (err3, exists) => {
        if (err3) return res.status(500).json({ error: err3.message });
        if (exists) return res.status(400).json({ error: 'Nama Kategori sudah digunakan oleh kategori lain.' });

        const kategoriData = { nama_kategori, detail };
        KategoriMatakuliah.updateKategoriMatakuliah(kategoriId, kategoriData, (err4) => {
          if (err4) return res.status(500).json({ error: err4.message });
          res.json({ message: 'Kategori Matakuliah berhasil diperbarui.', data: kategoriData });
        });
      });
    });
  });
};



// Menghapus kategori matakuliah berdasarkan ID
exports.deleteKategoriMatakuliah = (req, res) => {
  const { id } = req.params;

  // Cegah penghapusan kategori yang dilindungi (KP, Seminar Hasil, Skripsi)
  const protectedKategoriIds = [3, 4, 5];
  if (protectedKategoriIds.includes(parseInt(id))) {
    return res.status(400).json({
      error: 'Kategori ini tidak dapat dihapus karena digunakan dalam relasi sistem penting. (KP, Seminar, Magang)'
    });
  }

  // Cek apakah kategori digunakan oleh matakuliah yang sudah digunakan oleh mahasiswa atau sistem
  const checkUsageQuery = `
    SELECT m.id FROM matakuliah m
    LEFT JOIN mahasiswa_matakuliah mm ON mm.matakuliah_id = m.id
    LEFT JOIN skripsi_tahap st ON st.matakuliah_id = m.id
    LEFT JOIN kp ON kp.matakuliah_id = m.id
    LEFT JOIN matakuliah_magang mg ON mg.matakuliah_id = m.id
    WHERE m.kategori_id = ? AND (
      mm.matakuliah_id IS NOT NULL OR
      st.matakuliah_id IS NOT NULL OR
      kp.matakuliah_id IS NOT NULL OR
      mg.matakuliah_id IS NOT NULL
    )
  `;

  db.query(checkUsageQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0) {
      return res.status(400).json({
        error: 'Kategori ini tidak dapat dihapus karena Sudah digunakan dalam matakuliah Aktif'
      });
    }

    // Cek apakah kategori benar-benar ada
    KategoriMatakuliah.getAllKategoriMatakuliah((err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const kategori = results.find(k => k.id == id);
      if (!kategori) {
        return res.status(404).json({ error: 'Kategori Matakuliah dengan ID tersebut tidak ditemukan.' });
      }

      // Lanjutkan penghapusan jika aman
      KategoriMatakuliah.deleteKategoriMatakuliah(id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Kategori Matakuliah berhasil dihapus.' });
      });
    });
  });
};

