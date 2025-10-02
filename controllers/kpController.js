// controllers/kpController.js
const KpModel = require('../models/kpModel');
const MahasiswaMatakuliah = require('../models/mahasiswaMatakuliahModel');
const db = require('../config/db');

// Menambahkan data KP untuk mahasiswa
exports.addKP = (req, res) => {
  const { mahasiswa_id } = req.params;
  const { tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id } = req.body;
  const db = require('../config/db');

  // Cek apakah mahasiswa ada di database
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

    const KpModel = require('../models/kpModel');
// Validasi apakah dosen pembimbing KP ada di tabel dosen
    const qCheckDosen = 'SELECT id FROM dosen WHERE id = ?';
    db.query(qCheckDosen, [dosen_pembimbing_kp_id], (errDosen, dosenResults) => {
      if (errDosen) return res.status(500).json({ error: errDosen.message });
      if (dosenResults.length === 0) {
        return res.status(400).json({ error: `Dosen dengan ID ${dosen_pembimbing_kp_id} tidak ditemukan.` });
      }

      // Validasi apakah matakuliah ada di tabel matakuliah
      const qCheckMatakuliah = 'SELECT id FROM matakuliah WHERE id = ?';
      db.query(qCheckMatakuliah, [matakuliah_id], (errMatakuliah, matakuliahResults) => {
        if (errMatakuliah) return res.status(500).json({ error: errMatakuliah.message });
        if (matakuliahResults.length === 0) {
          return res.status(400).json({ error: `Matakuliah dengan ID ${matakuliah_id} tidak ditemukan.` });
        }
  // Cek apakah matakuliah kategori KP
  KpModel.isMatakuliahKP(matakuliah_id, (err, isKP) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!isKP) {
      return res.status(400).json({ error: 'Matakuliah yang dipilih tidak termasuk kategori Kerja Praktek.' });
    }

      

    // Cek apakah mahasiswa sudah konversi matakuliah KP via Magang
    const qKonversiMagang = `
      SELECT m.id
      FROM magang mg
      JOIN matakuliah_magang mm ON mm.magang_id = mg.id
      JOIN matakuliah m ON m.id = mm.matakuliah_id
      WHERE mg.mahasiswa_id = ?
        AND m.kategori_id = 3
    `;
    db.query(qKonversiMagang, [mahasiswa_id], (err, konversiRows) => {
      if (err) return res.status(500).json({ error: 'Gagal memeriksa data konversi Magang.' });
      if (konversiRows.length > 0) {
        return res.status(400).json({
          error: 'Mahasiswa ini sudah mengkonversi matakuliah Kerja Praktek melalui Magang. Tidak perlu menambahkan data KP lagi.'
        });
      }

      // Cek apakah mahasiswa sudah punya data KP
      KpModel.checkMahasiswaHasKP(mahasiswa_id, (err, hasKP) => {
        if (err) return res.status(500).json({ error: err.message });
        if (hasKP) {
          return res.status(400).json({ error: 'Mahasiswa ini sudah memiliki data KP.' });
        }

        // Tambah data KP
        KpModel.addKP(
          mahasiswa_id,
          tempat_kp,
          tgl_mulai,
          tgl_selesai,
          dosen_pembimbing_kp_id,
          nama_supervisor,
          matakuliah_id,
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
              message: 'Data KP berhasil ditambahkan dan mahasiswa dilulusi dari matakuliah kategori KP.'
            });
          }
        );
      });
    });
  });
})})}
  )};


// Menampilkan detail KP mahasiswa termasuk matakuliah kategori KP (nama, kurikulum, kategori, SKS)
exports.getDetailKP = (req, res) => {
  const { mahasiswa_id } = req.params; // Ambil mahasiswa_id dari parameter URL
  const db = require('../config/db');

  // Cek apakah mahasiswa ada
  const qCheckMahasiswa = 'SELECT * FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ error: 'Mahasiswa dengan ID tersebut tidak ditemukan' });
    }

    // Cek apakah mahasiswa sudah memiliki data KP
    const qCheckKP = 'SELECT * FROM kp WHERE mahasiswa_id = ?';
    db.query(qCheckKP, [mahasiswa_id], (err, kpResults) => {
      if (err) return res.status(500).json({ error: err.message });

      // Jika mahasiswa sudah punya data KP -> tampilkan detail KP
      if (kpResults.length > 0) {
        const kp = kpResults[0];
        // Ambil detail matakuliah KP
        const qMatakuliah = `
          SELECT m.id AS matakuliah_id, m.nama_mk, m.sks, m.kurikulum, km.nama_kategori
          FROM matakuliah m
          LEFT JOIN kategori_matakuliah km ON km.id = m.kategori_id
          WHERE m.id = ?
        `;
        db.query(qMatakuliah, [kp.matakuliah_id], (err, matakuliahResults) => {
          if (err) return res.status(500).json({ error: err.message });
          if (matakuliahResults.length === 0) {
            return res.status(404).json({ error: 'Matakuliah kategori KP tidak ditemukan' });
          }
          const matakuliah = matakuliahResults[0];

               // Ambil nama dosen pembimbing KP
          const qDosenPembimbingKP = 'SELECT nama FROM dosen WHERE id = ?';
          db.query(qDosenPembimbingKP, [kp.dosen_pembimbing_kp_id], (err, dosenResults) => {
            if (err) return res.status(500).json({ error: err.message });
            const dosenPembimbingKP = dosenResults.length > 0 ? dosenResults[0].nama : null;
          
          res.status(200).json({
            kp_id: kp.id,
            tempat_kp: kp.tempat_kp,
            tgl_mulai: kp.tgl_mulai,
            tgl_selesai: kp.tgl_selesai,
            nama_supervisor: kp.nama_supervisor,
            nama_dosen_pembimbing_kp: dosenPembimbingKP,
            matakuliah: {
              id: matakuliah.matakuliah_id,
              nama_mk: matakuliah.nama_mk,
              kurikulum: matakuliah.kurikulum,
              kategori: matakuliah.nama_kategori,
              sks: matakuliah.sks
            },
            peringatan: null
          });
        });
      });
      } else {
        // Jika tidak ada data KP, cek apakah ada konversi Magang
        const qCekKonversiMagang = `
          SELECT m.id, m.nama_mk, m.sks, m.kurikulum, k.nama_kategori
          FROM magang mg
          JOIN matakuliah_magang mm ON mm.magang_id = mg.id
          JOIN matakuliah m ON m.id = mm.matakuliah_id
          LEFT JOIN kategori_matakuliah k ON k.id = m.kategori_id
          WHERE mg.mahasiswa_id = ?
            AND m.kategori_id = 3
        `;
        db.query(qCekKonversiMagang, [mahasiswa_id], (err, konversiResults) => {
          if (err) return res.status(500).json({ error: err.message });

          if (konversiResults.length > 0) {
            // Ada matakuliah KP dikonversi via Magang
            res.status(200).json({
              peringatan: {
                pesan: "Mahasiswa ini sudah mengkonversi matakuliah Kerja Praktek melalui Magang.",
                matakuliah: konversiResults.map(mk => ({
                  id: mk.id,
                  nama_mk: mk.nama_mk,
                  sks: mk.sks,
                  kurikulum: mk.kurikulum,
                  kategori: mk.nama_kategori
                }))
              }
            });
          } else {
            // Tidak ada data KP dan tidak ada konversi Magang
            res.status(404).json({ error: "Mahasiswa ini belum memiliki data KP." });
          }
        });
      }
    });
  });
};


// Fungsi untuk update detail KP mahasiswa
exports.updateKP = (req, res) => {
  const { mahasiswa_id } = req.params;
  const { tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id } = req.body;
  const db = require('../config/db');
  const KpModel = require('../models/kpModel');

   // Cek apakah mahasiswa ada di database
  const qCheckMahasiswa = 'SELECT id FROM mahasiswa WHERE id = ?';
  db.query(qCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }
  // Validasi apakah dosen pembimbing KP ada di tabel dosen
    const qCheckDosen = 'SELECT id FROM dosen WHERE id = ?';
    db.query(qCheckDosen, [dosen_pembimbing_kp_id], (errDosen, dosenResults) => {
      if (errDosen) return res.status(500).json({ error: errDosen.message });
      if (dosenResults.length === 0) {
        return res.status(400).json({ error: `Dosen dengan ID ${dosen_pembimbing_kp_id} tidak ditemukan.` });
      }

      // Validasi apakah matakuliah ada di tabel matakuliah
      const qCheckMatakuliah = 'SELECT id FROM matakuliah WHERE id = ?';
      db.query(qCheckMatakuliah, [matakuliah_id], (errMatakuliah, matakuliahResults) => {
        if (errMatakuliah) return res.status(500).json({ error: errMatakuliah.message });
        if (matakuliahResults.length === 0) {
          return res.status(400).json({ error: `Matakuliah dengan ID ${matakuliah_id} tidak ditemukan.` });
        }

  // Cek apakah matakuliah kategori KP
  KpModel.isMatakuliahKP(matakuliah_id, (err, isKP) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!isKP) {
      return res.status(400).json({ error: 'Matakuliah yang dipilih tidak termasuk kategori Kerja Praktek.' });
    }

    // Cek apakah mahasiswa sudah konversi matakuliah KP via Magang
    const qKonversiMagang = `
      SELECT m.id
      FROM magang mg
      JOIN matakuliah_magang mm ON mm.magang_id = mg.id
      JOIN matakuliah m ON m.id = mm.matakuliah_id
      WHERE mg.mahasiswa_id = ?
        AND m.kategori_id = 3
    `;
    db.query(qKonversiMagang, [mahasiswa_id], (err, konversiRows) => {
      if (err) return res.status(500).json({ error: 'Gagal memeriksa data konversi Magang.' });
      if (konversiRows.length > 0) {
        return res.status(400).json({
          error: 'Mahasiswa ini sudah mengkonversi matakuliah Kerja Praktek melalui Magang. Tidak boleh memperbarui data KP.'
        });
      }

      // Cek apakah mahasiswa ada
      const qCheckMahasiswa = 'SELECT * FROM mahasiswa WHERE id = ?';
      db.query(qCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (mahasiswaResults.length === 0) {
          return res.status(404).json({ error: 'Mahasiswa dengan ID tersebut tidak ditemukan.' });
        }

        // Cek apakah mahasiswa punya data KP
        const qCheckKP = 'SELECT * FROM kp WHERE mahasiswa_id = ?';
        db.query(qCheckKP, [mahasiswa_id], (err, kpResults) => {
          if (err) return res.status(500).json({ error: err.message });
          if (kpResults.length === 0) {
            return res.status(404).json({ error: 'Mahasiswa ini belum memiliki data KP.' });
          }

          // Update data KP
          const qUpdate = `
            UPDATE kp
            SET tempat_kp = ?, tgl_mulai = ?, tgl_selesai = ?, dosen_pembimbing_kp_id = ?, nama_supervisor = ?, matakuliah_id = ?
            WHERE mahasiswa_id = ?
          `;
          const vals = [tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, matakuliah_id, mahasiswa_id];
          db.query(qUpdate, vals, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Data KP berhasil diperbarui.' });
          });
        });
      });
    });
  });
})}
    )}

  )};

// Menghapus data KP dan membatalkan kelulusan mahasiswa dari matakuliah KP
exports.deleteKP = (req, res) => {
  const { mahasiswa_id } = req.params; // ID dari mahasiswa untuk menghapus KP

  // Cek apakah mahasiswa ada dalam sistem
  const queryCheckMahasiswa = 'SELECT * FROM mahasiswa WHERE id = ?';
  db.query(queryCheckMahasiswa, [mahasiswa_id], (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });

    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ error: 'Mahasiswa dengan ID tersebut tidak ditemukan' });
    }

    // Ambil data KP untuk mendapatkan matakuliah_id
    const query = 'SELECT matakuliah_id FROM kp WHERE mahasiswa_id = ?';
    db.query(query, [mahasiswa_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(404).json({ error: 'Mahasiswa ini tidak memiliki data KP' });
      }

      const matakuliah_id = results[0].matakuliah_id;

      // Menghapus data KP
      KpModel.deleteKP(mahasiswa_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Menghapus matakuliah KP dari mahasiswa
        MahasiswaMatakuliah.removeMatakuliahKPFromMahasiswa(mahasiswa_id, matakuliah_id, (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(200).json({ message: 'Data KP berhasil dihapus dan kelulusan dari matakuliah kategori KP dibatalkan' });
        });
      });
    });
  });
};
