const Magang = require('../models/magangModel');
const MahasiswaMatakuliah = require('../models/mahasiswaMatakuliahModel');

// Menambahkan magang dan matakuliah yang dikonversi
exports.addMagang = (req, res) => {
  const { mahasiswa_id } = req.params;
  const { tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor, matakuliah_ids } = req.body;

   // Cek apakah mahasiswa ada di database
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }
  if (!matakuliah_ids || !Array.isArray(matakuliah_ids) || matakuliah_ids.length === 0) {
    return res.status(400).json({ error: 'Daftar matakuliah tidak valid.' });
  }

  Magang.addMagang(
    mahasiswa_id,
    tempat_magang,
    tgl_mulai,
    tgl_selesai,
    nama_supervisor,
    matakuliah_ids,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Jika invalids dikembalikan
      if (result.invalids && result.invalids.length > 0) {
        return res.status(400).json({
          error: 'Beberapa matakuliah tidak valid.',
          invalid_matakuliah: result.invalids
        });
      }

      res.status(201).json({
        message: 'Magang berhasil ditambahkan dan matakuliah dikonversi.',
        magang_id: result.magang_id
      });
    }
  );
})};


exports.updateMagang = (req, res) => {
  const { id } = req.params;
  const { tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor, matakuliah_ids } = req.body;

  if (!Array.isArray(matakuliah_ids) || matakuliah_ids.length === 0) {
    return res.status(400).json({ error: 'Daftar matakuliah tidak valid.' });
  }

  // Guard: cek magang ada
  const db = require('../config/db');
  db.query('SELECT id FROM magang WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: `Magang dengan ID ${id} tidak ditemukan.` });

    Magang.updateMagang(
      id, tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor, matakuliah_ids,
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.invalids && result.invalids.length > 0) {
          return res.status(400).json({ error: 'Beberapa matakuliah tidak valid.', invalid_matakuliah: result.invalids });
        }
        res.status(200).json({ message: 'Data magang berhasil diperbarui dan matakuliah dikonversi.' });
      }
    );
  });
};




// Fungsi untuk mendapatkan detail magang mahasiswa
exports.getDetailMagang = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;

  // Ambil detail magang dan matakuliah yang dikonversi
  Magang.getDetailMagang(mahasiswa_id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Jika tidak ditemukan data magang
    if (results.length === 0) {
      return res.status(404).json({ message: 'Data magang tidak ditemukan' });
    }

    res.json(results);  // Mengembalikan semua detail magang yang sudah digabungkan
  });
};

const db = require('../config/db');

// Fungsi untuk menghapus detail magang berdasarkan ID magang
exports.deleteMagang = (req, res) => {
  const { id } = req.params;  // ID dari tabel magang yang akan dihapus

  // Langkah 1: Ambil mahasiswa_id berdasarkan magang_id
  const queryGetMahasiswaId = 'SELECT mahasiswa_id FROM magang WHERE id = ?';
  db.query(queryGetMahasiswaId, [id], (err, magangResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (magangResults.length === 0) {
      return res.status(404).json({ error: 'Magang ini tidak ditemukan.' });
    }

    const mahasiswa_id = magangResults[0].mahasiswa_id; // Ambil mahasiswa_id dari data magang

    // Langkah 2: Mengambil semua matakuliah yang dikonversi untuk magang ini
    Magang.getMatakuliahByMagang(id, (err, matakuliahResults) => {
      if (err) return res.status(500).json({ error: err.message });

      if (matakuliahResults.length === 0) {
        return res.status(404).json({ error: 'Magang ini tidak ada matakuliah terkait.' });
      }

      // Langkah 3: Hapus relasi antara matakuliah dan magang di tabel matakuliah_magang
      Magang.deleteMatakuliahMagang(id, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Langkah 4: Hapus data magang
        Magang.deleteMagangById(id, (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          // Langkah 5: Hapus kelulusan matakuliah yang dikonversi dari mahasiswa_matakuliah
          const matakuliahIds = matakuliahResults.map(mk => mk.matakuliah_id);
          Magang.removeMatakuliahBatch(mahasiswa_id, matakuliahIds, (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: 'Detail magang berhasil dihapus dan matakuliah yang dikonversi dibatalkan kelulusannya.' });
          });
        });
      });
    });
  });
};
