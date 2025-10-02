const Skripsi = require('../models/skripsiModel');
const db = require('../config/db');


//TAHAP PROPOSAL
// Tambah seminar proposal
exports.addProposal = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;
  const db = require('../config/db');

  // 1. Validasi dosen tidak boleh sama
  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

  // 2. Validasi mahasiswa ada
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });
    }

    // 3. Validasi dosen ada
    const dosenIds = [
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id
    ];
    const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
    db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (dosenRows.length !== 3) {
        return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
      }

      // 4. Create or get skripsi
      const Skripsi = require('../models/skripsiModel');
      Skripsi.createOrGetSkripsi(mahasiswa_id, (err, skripsi_id) => {
        if (err) return res.status(500).json({ error: err.message });

        Skripsi.addTahapProposal(skripsi_id, data, (err) => {
          if (err) return res.status(400).json({ error: err.message });
          res.status(201).json({ message: 'Seminar proposal berhasil ditambahkan.' });
        });
      });
    });
  });
};

// Get seminar proposal
exports.getProposal = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const db = require('../config/db');

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;
    const Skripsi = require('../models/skripsiModel');
    Skripsi.getTahapProposal(skripsi_id, (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!data) return res.status(404).json({ error: 'Data seminar proposal belum diisi.' });

      res.json({
        id: data.id,
        tahap: data.tahap,
        judul: data.judul,
        tanggal: data.tanggal,
        dosen_pembimbing: { id: data.dosen_pembimbing_id, nama: data.nama_pembimbing },
        dosen_penguji_1: { id: data.dosen_penguji_1_id, nama: data.nama_penguji_1 },
        dosen_penguji_2: { id: data.dosen_penguji_2_id, nama: data.nama_penguji_2 }
      });
    });
  });
};


// Update seminar proposal
exports.updateProposal = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;
  const db = require('../config/db');

  // 1. Validasi dosen tidak sama
  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

  // 2. Validasi mahasiswa ada
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });
    }

    // 3. Validasi dosen ada
    const dosenIds = [
      data.dosen_pembimbing_id,
      data.dosen_penguji_1_id,
      data.dosen_penguji_2_id
    ];
    const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
    db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (dosenRows.length !== 3) {
        return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
      }

      // 4. Get skripsi id
      const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
      db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

        const skripsi_id = rows[0].id;
        const Skripsi = require('../models/skripsiModel');
        Skripsi.updateTahapProposal(skripsi_id, data, (err) => {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ message: 'Data seminar proposal berhasil diperbarui.' });
        });
      });
    });
  });
};


// Delete seminar proposal
exports.deleteProposal = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const db = require('../config/db');

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;

    // Cek apakah sudah ada tahap Seminar Hasil
    const qCheckHasil = `
      SELECT id FROM skripsi_tahap
      WHERE skripsi_id = ? AND tahap = 'hasil'
    `;
    db.query(qCheckHasil, [skripsi_id], (err, hasilRows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (hasilRows.length > 0) {
        return res.status(400).json({
          error: 'Tidak bisa menghapus Seminar Proposal karena Seminar Hasil sudah diisi. Hapus Seminar Hasil terlebih dahulu.'
        });
      }

      // Lanjut hapus tahap Proposal
      const Skripsi = require('../models/skripsiModel');
      Skripsi.deleteTahapProposal(skripsi_id, (err) => {
        if (err) return res.status(400).json({ error: err.message });

        res.json({ message: 'Data seminar proposal berhasil dihapus.' });
      });
    });
  });
};


//Tahap Seminar Hasil
exports.addHasil = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;
  const db = require('../config/db');

  // 1. Validasi dosen tidak sama
  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

  // 2. Validasi mahasiswa ada
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });
    }

    // 3. Validasi matakuliah kategori Seminar Hasil
    const qMatkul = `
      SELECT id FROM matakuliah
      WHERE id = ? AND kategori_id = 4
    `;
    db.query(qMatkul, [data.matakuliah_id], (err, matkulRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (matkulRows.length === 0) {
        return res.status(400).json({ error: 'Matakuliah bukan kategori Seminar Hasil atau tidak ditemukan.' });
      }

      // 4. Validasi dosen
      const dosenIds = [
        data.dosen_pembimbing_id,
        data.dosen_penguji_1_id,
        data.dosen_penguji_2_id
      ];
      const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
      db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (dosenRows.length !== 3) {
          return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
        }
        

        // 5. Cek status skripsi
        const qGetSkripsi = 'SELECT id, status FROM skripsi WHERE mahasiswa_id = ?';
        db.query(qGetSkripsi, [mahasiswa_id], (err, skripsiRows) => {
          if (err) return res.status(500).json({ error: err.message });
          if (skripsiRows.length === 0) {
            return res.status(400).json({ error: 'Data skripsi belum ada. Tambahkan seminar proposal terlebih dahulu.' });
          }

          const skripsi = skripsiRows[0];
    
          // 6. Cek apakah tahap hasil sudah ada
          const qCheckTahapHasil = `
            SELECT id FROM skripsi_tahap
            WHERE skripsi_id = ? AND tahap = 'hasil'
          `;
          db.query(qCheckTahapHasil, [skripsi.id], (err, hasilRows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (hasilRows.length > 0) {
              return res.status(400).json({ error: 'Data seminar hasil sudah ada.' });
            }

                 if (skripsi.status !== 'sudah_proposal') {
            return res.status(400).json({ error: 'Seminar hasil hanya bisa diisi setelah Seminar Proposal.' });
          }

            // 7. Cek apakah matakuliah sudah pernah dilulusi
            const qCheckLulus = `
              SELECT * FROM mahasiswa_matakuliah
              WHERE mahasiswa_id = ? AND matakuliah_id = ?
            `;
            db.query(qCheckLulus, [mahasiswa_id, data.matakuliah_id], (err, lulusRows) => {
              if (err) return res.status(500).json({ error: err.message });
              if (lulusRows.length > 0) {
                return res.status(400).json({ error: 'Matakuliah Seminar Hasil sudah dilulusi mahasiswa ini.' });
              }

              // 8. Jalankan proses insert
              const Skripsi = require('../models/skripsiModel');
              Skripsi.addTahapHasil(skripsi.id, data, mahasiswa_id, (err) => {
                if (err) return res.status(400).json({ error: err.message });
                res.status(201).json({ message: 'Seminar hasil berhasil ditambahkan.' });
              });
            });
          });
        });
      });
    });
  });
};


exports.getHasil = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const db = require('../config/db');

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;
    const Skripsi = require('../models/skripsiModel');
    Skripsi.getTahapHasil(skripsi_id, (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!data) return res.status(404).json({ error: 'Data seminar hasil belum diisi.' });

      res.json({
        id: data.id,
        tahap: data.tahap,
        judul: data.judul,
        tanggal: data.tanggal,
        matakuliah: {
          id: data.matakuliah_id,
          nama: data.nama_matakuliah,
          kode: data.kode_mk,
          kurikulum: data.kurikulum,
          sks: data.sks
        },
        dosen_pembimbing: {
          id: data.dosen_pembimbing_id,
          nama: data.nama_pembimbing,
          nip: data.nip_pembimbing,
        },
        dosen_penguji_1: {
          id: data.dosen_penguji_1_id,
          nama: data.nama_penguji_1,
          nip : data.nip_penguji_1,
        },
        dosen_penguji_2: {
          id: data.dosen_penguji_2_id,
          nama: data.nama_penguji_2,
          nip : data.nip_penguji_2
        }
      });
    });
  });
};

exports.updateHasil = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;
  const db = require('../config/db');

  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });

    const qMatkul = `
      SELECT id FROM matakuliah
      WHERE id = ? AND kategori_id = 4
    `;
    db.query(qMatkul, [data.matakuliah_id], (err, matkulRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (matkulRows.length === 0) {
        return res.status(400).json({ error: 'Matakuliah bukan kategori Seminar Hasil atau tidak ditemukan.' });
      }

      const dosenIds = [
        data.dosen_pembimbing_id,
        data.dosen_penguji_1_id,
        data.dosen_penguji_2_id
      ];
      const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
      db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (dosenRows.length !== 3) {
          return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
        }

        const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
        db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

          const skripsi_id = rows[0].id;
          const Skripsi = require('../models/skripsiModel');
          Skripsi.updateTahapHasil(skripsi_id, data, (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Data seminar hasil berhasil diperbarui.' });
          });
        });
      });
    });
  });
};

exports.deleteHasil = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const db = require('../config/db');

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;

    // Ambil matakuliah_id dari tahap hasil
    const qGetTahap = `
      SELECT matakuliah_id FROM skripsi_tahap
      WHERE skripsi_id = ? AND tahap = 'hasil'
    `;
    db.query(qGetTahap, [skripsi_id], (err, tahapRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (tahapRows.length === 0) {
        return res.status(404).json({ error: 'Data seminar hasil belum ada.' });
      }

      const matakuliah_id = tahapRows[0].matakuliah_id;

      // ✅ Cek apakah Seminar Tutup sudah ada
      const qCheckTutup = `
        SELECT id FROM skripsi_tahap
        WHERE skripsi_id = ? AND tahap = 'tutup'
      `;
      db.query(qCheckTutup, [skripsi_id], (err, tutupRows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (tutupRows.length > 0) {
          return res.status(400).json({
            error: 'Tidak bisa menghapus Seminar Hasil karena Seminar Tutup sudah diisi. Hapus Seminar Tutup terlebih dahulu.'
          });
        }

        // ✅ Lanjut hapus Seminar Hasil
        const Skripsi = require('../models/skripsiModel');
        Skripsi.deleteTahapHasil(skripsi_id, mahasiswa_id, matakuliah_id, (err) => {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ message: 'Data seminar hasil berhasil dihapus.' });
        });
      });
    });
  });
};


//Tahap Seminar Tutup
exports.addTutup = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;

  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });

    const qMatkul = 'SELECT id FROM matakuliah WHERE id = ? AND kategori_id = 5';
    db.query(qMatkul, [data.matakuliah_id], (err, mkRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (mkRows.length === 0) {
        return res.status(400).json({ error: 'Matakuliah bukan kategori Skripsi atau tidak ditemukan.' });
      }

         const qGetSkripsi = 'SELECT id, status FROM skripsi WHERE mahasiswa_id = ?';
          db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (rows.length === 0) return res.status(400).json({ error: 'Seminar proposal dan hasil harus diisi terlebih dahulu.' });

            const skripsi = rows[0];
          

            
      // 6. Cek apakah tahap tutup sudah ada
          const qCheckTahapHasil = `
            SELECT id FROM skripsi_tahap
            WHERE skripsi_id = ? AND tahap = 'tutup'
          `;
          db.query(qCheckTahapHasil, [skripsi.id], (err, hasilRows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (hasilRows.length > 0) {
              return res.status(400).json({ error: 'Data seminar tutup / sidang sudah ada.' });
            }

           if (skripsi.status !== 'sudah_hasil') {
              return res.status(400).json({ error: 'Seminar tutup hanya bisa diisi setelah Seminar Hasil.' });
            }

      const qCheckLulus = `
        SELECT * FROM mahasiswa_matakuliah
        WHERE mahasiswa_id = ? AND matakuliah_id = ?
      `;
      db.query(qCheckLulus, [mahasiswa_id, data.matakuliah_id], (err, lulusRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (lulusRows.length > 0) {
          return res.status(400).json({ error: 'Matakuliah Skripsi sudah dilulusi mahasiswa ini.' });
        }

        const dosenIds = [
          data.dosen_pembimbing_id,
          data.dosen_penguji_1_id,
          data.dosen_penguji_2_id
        ];
        const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
        db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
          if (err) return res.status(500).json({ error: err.message });
          if (dosenRows.length !== 3) {
            return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
          }

       



            Skripsi.addTahapTutup(skripsi.id, data, mahasiswa_id, (err) => {
              if (err) return res.status(400).json({ error: err.message });
              res.status(201).json({ message: 'Seminar tutup berhasil ditambahkan.' });
            });
          });
        });
      });
    });
  });
})};

exports.getTutup = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;
    Skripsi.getTahapTutup(skripsi_id, (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!data) return res.status(404).json({ error: 'Data seminar tutup belum diisi.' });

      res.json({
        id: data.id,
        tahap: data.tahap,
        judul: data.judul,
        tanggal: data.tanggal,
        matakuliah: {
          id: data.matakuliah_id,
          nama: data.nama_matakuliah,
          kode: data.kode_mk,
          kurikulum: data.kurikulum,
          sks: data.sks
        },
        dosen_pembimbing: {
          id: data.dosen_pembimbing_id,
          nama: data.nama_pembimbing,
          nip : data.nip_pembimbing,
        },
        dosen_penguji_1: {
          id: data.dosen_penguji_1_id,
          nama: data.nama_penguji_1,
          nip : data.nip_penguji_1,
        },
        dosen_penguji_2: {
          id: data.dosen_penguji_2_id,
          nama: data.nama_penguji_2,
          nip : data.nip_penguji_2
        }
      });
    });
  });
};

exports.updateTutup = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const data = req.body;

    const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mhsRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mhsRows.length === 0) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });


  const dosenSet = new Set([
    data.dosen_pembimbing_id,
    data.dosen_penguji_1_id,
    data.dosen_penguji_2_id
  ]);
  if (dosenSet.size < 3) {
    return res.status(400).json({ error: 'Dosen pembimbing dan penguji tidak boleh sama.' });
  }

    const dosenIds = [
        data.dosen_pembimbing_id,
        data.dosen_penguji_1_id,
        data.dosen_penguji_2_id
      ];
      const qCheckDosen = 'SELECT id FROM dosen WHERE id IN (?)';
      db.query(qCheckDosen, [dosenIds], (err, dosenRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (dosenRows.length !== 3) {
          return res.status(400).json({ error: 'Salah satu dosen tidak ditemukan.' });
        }

         const qMatkul = `
      SELECT id FROM matakuliah
      WHERE id = ? AND kategori_id = 5
    `;
    db.query(qMatkul, [data.matakuliah_id], (err, matkulRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (matkulRows.length === 0) {
        return res.status(400).json({ error: 'Matakuliah bukan kategori skripsi atau tidak ditemukan.' });
      }


  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;
    Skripsi.updateTahapTutup(skripsi_id, data, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Data seminar tutup berhasil diperbarui.' });
    });
  });
})})})};

exports.deleteTutup = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const db = require('../config/db');

  const qGetSkripsi = 'SELECT id FROM skripsi WHERE mahasiswa_id = ?';
  db.query(qGetSkripsi, [mahasiswa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Data skripsi belum ada.' });

    const skripsi_id = rows[0].id;

    const qGetTahap = `SELECT matakuliah_id FROM skripsi_tahap WHERE skripsi_id = ? AND tahap = 'tutup'`;
    db.query(qGetTahap, [skripsi_id], (err, tahapRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (tahapRows.length === 0) {
        return res.status(404).json({ error: 'Data seminar tutup belum ada.' });
      }

      const matakuliah_id = tahapRows[0].matakuliah_id;

      // ❌ Hapus dari mahasiswa_matakuliah (batalkan kelulusan skripsi)
      const qDeleteLulus = `
        DELETE FROM mahasiswa_matakuliah
        WHERE mahasiswa_id = ? AND matakuliah_id = ?
      `;
      db.query(qDeleteLulus, [mahasiswa_id, matakuliah_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // ✅ Lanjut hapus tahap tutup
        const Skripsi = require('../models/skripsiModel');
        Skripsi.deleteTahapTutup(skripsi_id, mahasiswa_id, matakuliah_id, (err) => {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ message: 'Data seminar tutup berhasil dihapus dan kelulusan skripsi dibatalkan.' });
        });
      });
    });
  });
};
