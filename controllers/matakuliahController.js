// controllers/matakuliahController.js
const Matakuliah = require('../models/matakuliahModel');



// GET semua matakuliah beserta nama kategori
exports.getAllMatakuliah = (req, res) => {
  Matakuliah.getAllMatakuliah((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};


// GET list semua matakuliah filtered by kategori dan kurkulum
exports.getFilteredMatakuliah = (req, res) => {
  const filters = {
    kategori_id: req.query.kategori_id || null,
    kurikulum: req.query.kurikulum || null
  };

  const Matakuliah = require('../models/matakuliahModel');
  Matakuliah.getFilteredMatakuliah(filters, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};


// Menambahkan kategori_id saat menambah matakuliah baru
exports.createMatakuliah = (req, res) => {
  const { kode_mk, nama_mk, sks, kurikulum, kategori_id } = req.body;

  if (!kode_mk || !nama_mk || !sks || !kurikulum || !kategori_id) {
    return res.status(400).json({
      error: 'Semua field wajib diisi: kode_mk, nama_mk, sks, kurikulum, dan kategori_id.'
    });
  }

  // ❗ Validasi apakah kategori_id valid
  Matakuliah.isKategoriExists(kategori_id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) {
      return res.status(400).json({ error: `Kategori dengan ID ${kategori_id} tidak ditemukan.` });
    }

    // Cek apakah kode_mk sudah ada
    Matakuliah.isKodeMkExists(kode_mk, (err, existsKode) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existsKode) return res.status(400).json({ error: 'Kode MK sudah digunakan, harus unik' });

      const matakuliahData = { kode_mk, nama_mk, sks, kurikulum, kategori_id };
      Matakuliah.createMatakuliah(matakuliahData, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Matakuliah berhasil ditambahkan', data: matakuliahData });
      });
    });
  });
};


// Endpoint untuk mengambil detail matakuliah berdasarkan id
exports.getMatakuliahDetailById = (req, res) => {
  const id = req.params.id; // Ambil id matakuliah dari parameter URL

  // Mengambil detail matakuliah berdasarkan id
  Matakuliah.getMatakuliahById(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!result) {
      return res.status(404).json({ message: 'Matakuliah tidak ditemukan' });
    }

    // Response dengan data detail matakuliah
    res.status(200).json(result);
  });
};

/// PUT update matakuliah by id
exports.updateMatakuliah = (req, res) => {
  const { id } = req.params;
  const { kode_mk, nama_mk, sks, kurikulum, kategori_id } = req.body;

  // Validasi field wajib
  if (!kode_mk || !nama_mk || !sks || !kurikulum || !kategori_id) {
    return res.status(400).json({
      error: 'Semua field wajib diisi: kode_mk, nama_mk, sks, kurikulum, dan kategori_id.'
    });
  }

  // Cek apakah kode_mk sudah dipakai matakuliah lain
  Matakuliah.isKodeMkExistsExcludeId(kode_mk, id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'Kode MK sudah digunakan oleh matakuliah lain, harus unik' });

    // Ambil data matakuliah asli
    Matakuliah.getById(id, (err, matakuliah) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!matakuliah) {
        return res.status(404).json({ error: 'Matakuliah dengan ID tersebut tidak ditemukan' });
      }

      // ❗ Validasi apakah kategori_id valid
  Matakuliah.isKategoriExists(kategori_id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) {
      return res.status(400).json({ error: `Kategori dengan ID ${kategori_id} tidak ditemukan.` });
    }

      // Cek apakah digunakan di KP (kategori tidak boleh diubah jika ya)
      Matakuliah.isMatakuliahUsedInKP(id, (err, usedInKP) => {
        if (err) return res.status(500).json({ error: err.message });

        // Cek apakah digunakan di skripsi_tahap (hasil/tutup)
        Matakuliah.isMatakuliahUsedInSkripsiTahap(id, (err, usedInSkripsi) => {
          if (err) return res.status(500).json({ error: err.message });

          // Jika sudah digunakan, kategori tidak boleh diubah
          if ((usedInKP || usedInSkripsi) && kategori_id !== matakuliah.kategori_id) {
            return res.status(400).json({
              error: 'Kategori matakuliah tidak dapat diubah karena sudah digunakan dalam sistem (KP, Seminar Hasil, atau Tutup).'
            });
          }

          // Lanjut update
          const matakuliahData = { kode_mk, nama_mk, sks, kurikulum, kategori_id };
          Matakuliah.updateMatakuliah(id, matakuliahData, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Matakuliah berhasil diperbarui', id });
          });
        });
      });
    });
  });
});
};




// DELETE matakuliah by id
exports.deleteMatakuliah = (req, res) => {
  const { id } = req.params;

  // Cek apakah matakuliah ada
  Matakuliah.getById(id, (err, matakuliah) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!matakuliah) {
      return res.status(404).json({ error: 'Matakuliah dengan ID tersebut tidak ditemukan' });
    }

    // Cek apakah matakuliah sedang digunakan
    Matakuliah.isMatakuliahInUse(id, (err, inUse) => {
      if (err) return res.status(500).json({ error: err.message });

      if (inUse) {
        return res.status(400).json({
          error: 'Matakuliah tidak dapat dihapus karena sedang digunakan dalam sistem (KP, seminar, magang, atau sudah dilulusi mahasiswa).'
        });
      }

      // Lanjut hapus
      Matakuliah.deleteMatakuliah(id, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Matakuliah berhasil dihapus', id });
      });
    });
  });
};


// GET matakuliah berdasarkan tahun kurikulum
exports.getMatakuliahByKurikulum = (req, res) => {
  const { kurikulum } = req.query;  // Ambil tahun kurikulum dari query string

  if (!kurikulum) {
    return res.status(400).json({ error: 'Tahun kurikulum wajib diisi.' });
  }

  Matakuliah.getMatakuliahByKurikulum(kurikulum, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};






//INPUT VIA EXCEL
const path = require('path');
const fs = require('fs');
const uploadMatakuliah = require('../middleware/uploadMatakuliah'); // Import middleware untuk upload
const { parseExcelAndImportMatakuliah } = require('../utils/excelParserMatakuliah');

// Endpoint untuk upload file Excel dan update matakuliah
exports.importMatakuliahExcel = [uploadMatakuliah.single('excelFile'), (req, res) => {
  const filePath = req.file.path; // Dapatkan path file Excel yang diupload

  parseExcelAndImportMatakuliah(filePath)
    .then(result => {
      // Menghapus file setelah selesai diproses
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Gagal menghapus file:', err);
        } else {
          console.log('File berhasil dihapus');
        }
      });

      // Kirimkan hasil proses upload dan update
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(400).json({ error: err.message });
    });
}];
