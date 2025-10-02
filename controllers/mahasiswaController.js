const Mahasiswa = require('../models/mahasiswaModel');
const { parseExcelAndImport } = require('../utils/excelParser');
const Matakuliah = require('../models/matakuliahModel');
const db = require('../config/db'); // Pastikan ini adalah koneksi database Anda

// GET semua mahasiswa
exports.getAllMahasiswa = (req, res) => {
  Mahasiswa.getAllMahasiswa((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

//Get List Mahasiswa Filtered by Angkatan, status, dan tahapan Skripsi
exports.getFilteredMahasiswa = (req, res) => {
  const filters = {
    angkatan: req.query.angkatan || null,
    status: req.query.status || null,
    tahap_skripsi: req.query.tahap_skripsi || null
  };

  const validStatus = ['Lulus', 'Belum Lulus', 'Drop Off'];
  const validSkripsi = ['belum_proposal', 'sudah_proposal', 'sudah_hasil', 'sudah_tutup'];

  if (filters.status && !validStatus.includes(filters.status)) {
    return res.status(400).json({ error: 'Status mahasiswa tidak valid.' });
  }

  if (filters.tahap_skripsi && !validSkripsi.includes(filters.tahap_skripsi)) {
    return res.status(400).json({ error: 'Status tahap skripsi tidak valid.' });
  }

  const Mahasiswa = require('../models/mahasiswaModel');
  Mahasiswa.getMahasiswaFiltered(filters, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};


// GET detail mahasiswa by id
exports.getMahasiswaById = (req, res) => {
  const id = req.params.id;
  Mahasiswa.getMahasiswaById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
    res.json(results[0]);
  });
};

// POST tambah mahasiswa baru
exports.createMahasiswa = (req, res) => {
  const nim = req.body.nim;
  Mahasiswa.isNimExists(nim, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'NIM sudah digunakan, harus unik' });

    Mahasiswa.createMahasiswa(req.body, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Mahasiswa ditambahkan', data: req.body });
    });
  });
};

// PUT update mahasiswa by id
exports.updateMahasiswa = (req, res) => {
  const id = req.params.id;
  const nim = req.body.nim;

  

  Mahasiswa.isNimExistsExcludeId(nim, id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'NIM sudah digunakan oleh mahasiswa lain, harus unik' });

    const allowedStatus = ['Belum Lulus', 'Lulus', 'Drop Off'];
    if (req.body.status && !allowedStatus.includes(req.body.status)) {
    return res.status(400).json({ error: 'Status mahasiswa tidak valid' });
}

    Mahasiswa.updateMahasiswa(id, req.body, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Mahasiswa diperbarui', id });
    });
  });
};

// DELETE mahasiswa by id
exports.deleteMahasiswaById = (req, res) => {
  const mahasiswaId = req.params.id;

  // Ambil info mahasiswa dulu
  const getInfoSql = `SELECT id, nama, angkatan FROM mahasiswa WHERE id = ?`;

  db.query(getInfoSql, [mahasiswaId], (errInfo, rows) => {
    if (errInfo || !rows.length) {
      return res.status(404).json({ error: 'Mahasiswa tidak ditemukan', detail: errInfo });
    }

    const mahasiswa = rows[0];

    db.beginTransaction(err => {
      if (err) return res.status(500).json({ error: 'Gagal memulai transaksi', detail: err });

      const queries = [
        {
          sql: `DELETE st FROM skripsi_tahap st 
                JOIN skripsi s ON st.skripsi_id = s.id 
                WHERE s.mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE FROM skripsi WHERE mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE mm FROM matakuliah_magang mm 
                JOIN magang m ON mm.magang_id = m.id 
                WHERE m.mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE FROM magang WHERE mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE FROM kp WHERE mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ?`,
          values: [mahasiswaId]
        },
        {
          sql: `DELETE FROM mahasiswa WHERE id = ?`,
          values: [mahasiswaId]
        }
      ];

      const executeQueries = (index = 0) => {
        if (index >= queries.length) {
          return db.commit(errCommit => {
            if (errCommit) {
              return db.rollback(() => res.status(500).json({ error: 'Gagal commit transaksi', detail: errCommit }));
            }
            res.json({
              message: 'Mahasiswa berhasil dihapus',
              data: {
                id: mahasiswa.id,
                nama: mahasiswa.nama,
                angkatan: mahasiswa.angkatan
              }
            });
          });
        }

        const { sql, values } = queries[index];
        db.query(sql, values, (err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ error: 'Gagal eksekusi query', detail: err }));
          }
          executeQueries(index + 1);
        });
      };

      executeQueries();
    });
  });
};



//Add and Update Via Excel
// Endpoint untuk upload file Excel 
exports.importMahasiswaExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    // Proses file dan import data mahasiswa
    const results = await parseExcelAndImport(req.file.path);

    // Menghapus file setelah selesai diproses
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Gagal menghapus file:', err);
      } else {
        console.log('File berhasil dihapus');
      }
    });

    res.json({ message: 'Proses selesai', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




//Matakuliah Mahasiswa

// Fungsi untuk menambah lebih dari satu matakuliah yang sudah dilulusi oleh mahasiswa
exports.addMultipleMatakuliahToMahasiswa = (req, res) => {
  const mahasiswaId = req.params.id;
  const matakuliahList = req.body.matakuliah;  // array of matakuliah objects { matakuliah_id }

  // Cek apakah mahasiswa dengan ID tersebut ada
  Mahasiswa.getMahasiswaById(mahasiswaId, (err, mahasiswaResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (mahasiswaResults.length === 0) {
      return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
    }
    const mahasiswaName = mahasiswaResults[0].nama; // Ambil nama mahasiswa

    // Array untuk menyimpan nama-nama matakuliah yang berhasil ditambahkan
    let addedMatakuliah = [];

    // Loop untuk menambahkan setiap mata kuliah ke mahasiswa
    const addMatakuliahPromises = matakuliahList.map(matakuliah => {
      return new Promise((resolve, reject) => {
        // Cek apakah matakuliah dengan ID tersebut ada
        Matakuliah.getMatakuliahById(matakuliah.matakuliah_id, (err, matakuliahResults) => {
          if (err) return reject({ error: err.message });
          if (matakuliahResults.length === 0) {
            return reject({ message: `Matakuliah dengan ID ${matakuliah.matakuliah_id} tidak ditemukan` });
          }

          const matakuliahName = matakuliahResults[0].nama_mk; // Ambil nama matakuliah

          // Tambah matakuliah ke mahasiswa
          Mahasiswa.addMatakuliahToMahasiswa(mahasiswaId, matakuliah.matakuliah_id, (err, results) => {
            if (err) return reject({ error: err.message });

            // Simpan nama matakuliah yang berhasil ditambahkan
            addedMatakuliah.push(matakuliahName);
            resolve();
          });
        });
      });
    });

    // Tunggu sampai semua matakuliah berhasil ditambahkan
    Promise.all(addMatakuliahPromises)
      .then(() => {
        res.status(201).json({
          message: 'Matakuliah berhasil ditambahkan ke mahasiswa',
          mahasiswa: mahasiswaName,
          matakuliah_berhasil_ditambahkan: addedMatakuliah
        });
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });
};


//MATAKULIAH DAN MAHASISWA
//Menambah Matakuliah Yang dilulusi Mahasiswa
const MahasiswaMatakuliah = require('../models/mahasiswaMatakuliahModel');

// controllers/mahasiswaController.js

// Menambah matakuliah ke mahasiswa
exports.addMatakuliahToMahasiswa = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const matakuliah_data = req.body.matakuliah;  // Array of matakuliah objects

  
  if (!Array.isArray(matakuliah_data) || matakuliah_data.length === 0) {
    return res.status(400).json({ error: 'Data matakuliah tidak boleh kosong' });
  }

  // 🔍 Cek apakah mahasiswa ada
  Mahasiswa.getMahasiswaById(mahasiswa_id, (err, resultMhs) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data mahasiswa' });
    if (!resultMhs || resultMhs.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

  // Extract matakuliah_ids from the array of objects
  const matakuliah_ids = matakuliah_data.map(item => item.matakuliah_id);

  // Cek apakah setiap matakuliah_id ada di tabel matakuliah
  Matakuliah.checkMatakuliahExists(matakuliah_ids, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });

    // Filter out the matakuliah_ids that do not exist in the database
    const invalidIds = matakuliah_ids.filter(id => !exists.includes(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `Matakuliah dengan ID ${invalidIds.join(', ')} tidak ditemukan di database.`
      });
    }

    // Cek kategori matakuliah: Apakah kategori 3, 4, atau 5 (Kerja Praktek, Seminar Hasil, Skripsi)
    MahasiswaMatakuliah.isMatakuliahKategoriTertentu(matakuliah_ids[0], (err, isTertentu) => {
      if (err) return res.status(500).json({ error: err.message });
      if (isTertentu) {
        return res.status(400).json({
          error: 'Matakuliah kategori Kerja Praktek, Seminar Hasil, dan Skripsi tidak bisa ditambahkan.'
        });
      }

      // Cek apakah matakuliah sudah diambil oleh mahasiswa ini
      MahasiswaMatakuliah.checkMatakuliahAlreadyTaken(mahasiswa_id, matakuliah_ids, (err, exists) => {
        if (err) return res.status(500).json({ error: err.message });

        // Pisahkan matakuliah yang sudah dilulusi dan yang belum dilulusi
        const alreadyTaken = exists.map(item => item.matakuliah_id);  // ID matakuliah yang sudah dilulusi
        const notTaken = matakuliah_ids.filter(id => !alreadyTaken.includes(id));  // ID matakuliah yang belum dilulusi

        let warningMessage = '';
        let alreadyTakenNames = [];

        if (alreadyTaken.length > 0) {
          // Ambil nama matakuliah yang sudah dilulusi
          Matakuliah.getMatakuliahByIds(alreadyTaken, (err, matakuliah) => {
            if (err) return res.status(500).json({ error: 'Gagal mengambil data matakuliah' });

            // Ambil nama-nama matakuliah yang sudah dilulusi
            alreadyTakenNames = matakuliah.map(mk => mk.nama_mk).join(', ');

            warningMessage = `Peringatan: Matakuliah dengan nama ${alreadyTakenNames} sudah dilulusi.`;
          });
        }

        // Jika ada matakuliah yang belum dilulusi, lanjutkan untuk menambahkannya
        if (notTaken.length > 0) {
          MahasiswaMatakuliah.addMatakuliahBatch(mahasiswa_id, notTaken, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            // Ambil nama mahasiswa dan nama matakuliah yang dilulusi
            Mahasiswa.getMahasiswaById(mahasiswa_id, (err, resultMhs) => {
              if (err || !resultMhs.length) return res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });

              const mahasiswa = resultMhs[0];

              Matakuliah.getMatakuliahByIds(notTaken, (err, matakuliah) => {
                if (err) return res.status(500).json({ error: 'Gagal mengambil data matakuliah' });

                // Response dengan struktur yang lebih terperinci
                const matakuliahNames = matakuliah.map(mk => mk.nama_mk);

                res.status(201).json({
                  message: "Matakuliah berhasil dilulusi",
                  nama_mahasiswa: mahasiswa.nama,
                  nim_mahasiswa: mahasiswa.nim,
                  matakuliah: matakuliahNames,
                  warning: warningMessage  // Menampilkan peringatan jika ada matakuliah yang sudah dilulusi
                });
              });
            });
          });
        } else {
          // Jika semua matakuliah sudah dilulusi
          res.status(400).json({
            error: warningMessage || 'Semua matakuliah sudah dilulusi oleh mahasiswa ini.'
          });
        }
      });
    });
  });
})};



// Menampilkan daftar matakuliah yang sudah dilulusi oleh mahasiswa
exports.getMatakuliahByMahasiswa = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;

  // 🔍 Cek apakah mahasiswa ada
  Mahasiswa.getMahasiswaById(mahasiswa_id, (err, resultMhs) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data mahasiswa' });
    if (!resultMhs || resultMhs.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

    const mahasiswa = resultMhs[0];

    // Ambil daftar matakuliah yang sudah dilulusi
    MahasiswaMatakuliah.getMatakuliahByMahasiswa(mahasiswa_id, (err, matakuliah) => {
      if (err)
        return res.status(500).json({ error: 'Gagal mengambil data matakuliah' });

      // Ambil semua matakuliah hasil konversi magang
      const qKonversiMagang = `
        SELECT mm.matakuliah_id
        FROM matakuliah_magang mm
        JOIN magang mg ON mg.id = mm.magang_id
        WHERE mg.mahasiswa_id = ?
      `;
      const db = require('../config/db');
      db.query(qKonversiMagang, [mahasiswa_id], (err, konversiRows) => {
        if (err)
          return res.status(500).json({ error: 'Gagal mengambil data konversi magang' });

        const matakuliahKonversiIds = konversiRows.map(r => r.matakuliah_id);

        // Siapkan response
        let totalSks = 0;
        const matakuliahDetails = matakuliah.map(mk => {
          totalSks += mk.sks;
          return {
            matakuliah_id: mk.matakuliah_id,
            nama_mk: mk.nama_mk,
            kode_mk: mk.kode_mk,
            sks: mk.sks,
            kurikulum: mk.kurikulum,
            kategori: mk.nama_kategori,
            konversi: matakuliahKonversiIds.includes(mk.matakuliah_id) ? "Magang" : null
          };
        });

        res.status(200).json({
          nama_mahasiswa: mahasiswa.nama,
          nim_mahasiswa: mahasiswa.nim,
          matakuliah: matakuliahDetails,
          total_sks: totalSks
        });
      });
    });
  });
};


// Fungsi untuk menghapus matakuliah dari mahasiswa
exports.removeMatakuliahFromMahasiswa = (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const matakuliah_id = req.params.matakuliah_id;

   // 🔍 Cek apakah mahasiswa ada
  Mahasiswa.getMahasiswaById(mahasiswa_id, (err, resultMhs) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data mahasiswa' });
    if (!resultMhs || resultMhs.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

      // 🔍 Cek apakah matakuliah ada
  Matakuliah.getById(matakuliah_id, (err, matakuliahDetail) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data matakuliah' });
    if (!matakuliahDetail) {
      return res.status(404).json({ error: `Matakuliah dengan ID ${matakuliah_id} tidak ditemukan.` });
    }

  // Cek apakah matakuliah kategori tertentu
  MahasiswaMatakuliah.isMatakuliahKategoriTertentu(matakuliah_id, (err, isTertentu) => {
    if (err) return res.status(500).json({ error: err.message });

    if (isTertentu) {
      return res.status(400).json({
        error: 'Matakuliah kategori Kerja Praktek, Seminar Hasil, dan Skripsi tidak dapat dihapus dari sini.'
      });
    }

    // Cek apakah matakuliah ini hasil konversi magang
    const db = require('../config/db');
    const qCekKonversi = `
      SELECT mm.matakuliah_id
      FROM matakuliah_magang mm
      JOIN magang mg ON mg.id = mm.magang_id
      WHERE mg.mahasiswa_id = ?
        AND mm.matakuliah_id = ?
    `;
    db.query(qCekKonversi, [mahasiswa_id, matakuliah_id], (err, konversiRows) => {
      if (err) return res.status(500).json({ error: 'Gagal memeriksa konversi magang.' });

      if (konversiRows.length > 0) {
        return res.status(400).json({
          error: 'Matakuliah ini hasil konversi Magang. Silakan hapus dari detail Magang.'
        });
      }

      // Cek apakah matakuliah memang sudah dilulusi
      MahasiswaMatakuliah.checkMatakuliahAlreadyTaken(mahasiswa_id, [matakuliah_id], (err, exists) => {
        if (err) return res.status(500).json({ error: err.message });

        if (exists.length === 0) {
          return res.status(400).json({
            error: 'Matakuliah ini belum dilulusi oleh mahasiswa.'
          });
        }

        // Ambil detail matakuliah dan mahasiswa
        Matakuliah.getMatakuliahByIds(matakuliah_id, (err, matakuliah) => {
          if (err) return res.status(500).json({ error: 'Gagal mengambil data matakuliah' });

          Mahasiswa.getMahasiswaById(mahasiswa_id, (err, mahasiswa) => {
            if (err) return res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });

            // Hapus relasi matakuliah dari mahasiswa
            MahasiswaMatakuliah.removeMatakuliah(mahasiswa_id, matakuliah_id, (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(200).json({
                message: `${mahasiswa[0].nama} berhasil dihapus dari matakuliah ${matakuliah[0].nama_mk}`,
                data: {
                  matakuliah: matakuliah[0].nama_mk,
                  kode_matakuliah: matakuliah[0].kode_mk,
                  nim: mahasiswa[0].nim,
                  nama_mahasiswa: mahasiswa[0].nama
                }
              });
            });
          });
        });
      });
    });
  });
})}
  )};


// GET mata kuliah yang belum diluluskan oleh mahasiswa beserta total SKS yang belum diluluskan
exports.getMatakuliahBelumDilulusi = (req, res) => {
  const mahasiswa_id = req.params.id; // Ambil mahasiswa_id dari parameter URL
  // 🔍 Cek apakah mahasiswa ada
  Mahasiswa.getMahasiswaById(mahasiswa_id, (err, resultMhs) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data mahasiswa' });
    if (!resultMhs || resultMhs.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

  MahasiswaMatakuliah.getMatakuliahBelumDilulusi(mahasiswa_id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result); // Kirimkan hasil mata kuliah yang belum diluluskan beserta total SKS
  });
})};



//Melihat list matakuliah yang belum dilulusi mahasiswa filtered by kategori dan kurikulum
exports.getMatakuliahBelumDilulusiFiltered = (req, res) => {
  const mahasiswa_id = req.params.id;
  const filters = {
    kategori_id: req.query.kategori_id || null,
    kurikulum: req.query.kurikulum || null
  };

  Mahasiswa.getMahasiswaById(mahasiswa_id, (err, mhsRows) => {
    if (err) return res.status(500).json({ error: 'Gagal memeriksa data mahasiswa' });
    if (!mhsRows || mhsRows.length === 0) {
      return res.status(404).json({ error: `Mahasiswa dengan ID ${mahasiswa_id} tidak ditemukan.` });
    }

    MahasiswaMatakuliah.getMatakuliahBelumDilulusiFiltered(mahasiswa_id, filters, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  });
};






//UPLOAD EXCEL
const path = require('path');
const fs = require('fs'); // Import fs untuk menghapus file
const uploadMatakuliah = require('../middleware/uploadMatakuliahMahasiswa'); // Import middleware untuk upload
const { parseExcelAndUpdateMatakuliah } = require('../utils/excelParserMatakuliahMahasiswa');

// Endpoint untuk upload file Excel dan update matakuliah mahasiswa
exports.importMatakuliahExcel = [uploadMatakuliah.single('excelFile'), (req, res) => {
  const filePath = req.file.path; // Dapatkan path file Excel yang diupload

  parseExcelAndUpdateMatakuliah(filePath)
    .then(result => {
      // Menghapus file setelah selesai diproses
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Gagal menghapus file:', err);
        } else {
          console.log('File berhasil dihapus');
        }
      });

      res.status(200).json(result); // Kirimkan hasil proses upload dan update
    })
    .catch(err => {
      res.status(400).json({ error: err.message });
    });
}];





//Backup CSV
const { Parser } = require('json2csv');
const { format } = require('date-fns');

exports.exportMahasiswaCSV = (req, res) => {
  const { angkatan } = req.query;
  if (!angkatan) return res.status(400).json({ error: 'Parameter angkatan wajib diisi' });

  const sqlMahasiswa = `
    SELECT m.id AS mahasiswa_id, m.nim, m.nama, m.angkatan, m.status,
           m.tanggal_lahir, m.alamat, m.no_telp, m.no_telp_ortu,
           d.nama AS nama_dosen_pa
    FROM mahasiswa m
    LEFT JOIN dosen d ON m.dosen_pa_id = d.id
    WHERE m.angkatan = ?
  `;

  db.query(sqlMahasiswa, [angkatan], (err, mahasiswaRows) => {
    if (err || !mahasiswaRows.length) return res.status(500).json({ error: 'Gagal mengambil data mahasiswa', detail: err });

    const mhsIds = mahasiswaRows.map(m => m.mahasiswa_id);

   const sqlMatkul = `
  SELECT mm.mahasiswa_id, mk.kode_mk, mk.nama_mk, mk.sks,
  FROM mahasiswa_matakuliah mm
  JOIN matakuliah mk ON mm.matakuliah_id = mk.id
  WHERE mm.mahasiswa_id IN (?)
`;


    const sqlKP = `
      SELECT kp.mahasiswa_id, kp.tempat_kp, kp.tgl_mulai, kp.tgl_selesai,
             d.nama AS nama_dosen_kp, mk.nama_mk AS nama_matkul_kp
      FROM kp
      LEFT JOIN dosen d ON kp.dosen_pembimbing_kp_id = d.id
      LEFT JOIN matakuliah mk ON kp.matakuliah_id = mk.id
      WHERE kp.mahasiswa_id IN (?)
    `;

    const sqlMagang = `
    SELECT *
    FROM magang
    WHERE mahasiswa_id IN (?)

    `;

    const sqlMatkulMagang = `
      SELECT mm.magang_id, mk.kode_mk, mk.nama_mk
      FROM matakuliah_magang mm
      JOIN matakuliah mk ON mm.matakuliah_id = mk.id
      WHERE mm.magang_id IN (SELECT id FROM magang WHERE mahasiswa_id IN (?))

    `;

    const sqlSkripsi = `
  SELECT st.*, s.mahasiswa_id,
         dp.nama AS nama_pembimbing,
         d1.nama AS nama_penguji_1,
         d2.nama AS nama_penguji_2
  FROM skripsi s
  JOIN skripsi_tahap st ON s.id = st.skripsi_id
  LEFT JOIN dosen dp ON st.dosen_pembimbing_id = dp.id
  LEFT JOIN dosen d1 ON st.dosen_penguji_1_id = d1.id
  LEFT JOIN dosen d2 ON st.dosen_penguji_2_id = d2.id
  WHERE s.mahasiswa_id IN (?)
`;


db.query(sqlMatkul, [mhsIds], (errMatkul, matkulRows) => {
db.query(sqlKP, [mhsIds], (errKP, kpRows) => {
db.query(sqlMagang, [mhsIds], (errMagang, magangRows) => {
  if (errMagang || !magangRows) {
    return res.status(500).json({ error: 'Gagal ambil data magang', detail: errMagang });
  }

  db.query(sqlMatkulMagang, [mhsIds], (errMatkulMagang, matkulMagangRows) => {
    if (errMatkulMagang || !matkulMagangRows) {
      return res.status(500).json({ error: 'Gagal ambil matkul magang', detail: errMatkulMagang });
    }

     db.query(sqlSkripsi, [mhsIds], (errSkripsi, skripsiRows) => {
    if (errSkripsi || !skripsiRows) {
      return res.status(500).json({ error: 'Gagal ambil data skripsi', detail: errSkripsi });
    }


    
            const hasilGabung = mahasiswaRows.map(m => {
              const matkul = matkulRows.filter(x => x.mahasiswa_id === m.mahasiswa_id);
              const kp = kpRows.find(k => k.mahasiswa_id === m.mahasiswa_id);
               const magang = magangRows.find(g => g.mahasiswa_id === m.mahasiswa_id);
              const matkulMagang = magang
              ? matkulMagangRows
                  .filter(mm => mm.magang_id === magang.id)
                  .map(mm => `${mm.kode_mk} - ${mm.nama_mk}`)
                  .join('; ')
              : '';

              const skripsiTahap = skripsiRows
              .filter(s => s.mahasiswa_id === m.mahasiswa_id)
              .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0]; // ambil terbaru



              return {
                NIM: m.nim,
                Nama: m.nama,
                Angkatan: m.angkatan,
                Status: m.status,
                'Tanggal Lahir': m.tanggal_lahir ? format(new Date(m.tanggal_lahir), 'yyyy-MM-dd') : '',
                Alamat: m.alamat,
                'No. Telp': m.no_telp ? `'${m.no_telp}` : '',
                'No. Telp Ortu': m.no_telp_ortu ? `'${m.no_telp_ortu}` : '',
                'Dosen PA': m.nama_dosen_pa || '',
                'Matakuliah Lulus': matkul.map(x => `${x.kode_mk} - ${x.nama_mk}`).join('; '),
                'Total SKS Lulus': matkul.reduce((total, x) => total + (x.sks || 0), 0),
                'Tempat KP': kp?.tempat_kp || '',
                'Tanggal Mulai KP': kp?.tgl_mulai ? format(new Date(kp.tgl_mulai), 'yyyy-MM-dd') : '',
                'Tanggal Selesai KP': kp?.tgl_selesai ? format(new Date(kp.tgl_selesai), 'yyyy-MM-dd') : '',
                'Dosen Pembimbing KP': kp?.nama_dosen_kp || '',
                'Matkul KP': kp?.nama_matkul_kp || '',
                'Tempat Magang': magang?.tempat_magang || '',
                'Tanggal Mulai Magang': magang?.tgl_mulai ? format(new Date(magang.tgl_mulai), 'yyyy-MM-dd') : '',
                'Tanggal Selesai Magang': magang?.tgl_selesai ? format(new Date(magang.tgl_selesai), 'yyyy-MM-dd') : '',
                'Supervisor Magang': magang?.nama_supervisor || '',
                'Matkul Magang': matkulMagang,
                'Tahap Skripsi Terakhir': skripsiTahap?.tahap || '',
                'Tanggal Tahap Skripsi': skripsiTahap?.tanggal ? format(new Date(skripsiTahap.tanggal), 'yyyy-MM-dd') : '',
                'Judul Skripsi': skripsiTahap?.judul || '',
                'Dosen Pembimbing TA': skripsiTahap?.nama_pembimbing || '',
                'Penguji 1': skripsiTahap?.nama_penguji_1 || '',
                'Penguji 2': skripsiTahap?.nama_penguji_2 || '',
              };
            });

            const parser = new Parser({ delimiter: ';' }); // Excel-friendly
            const csv = parser.parse(hasilGabung);

            res.header('Content-Type', 'text/csv');
            res.attachment(`mahasiswa_angkatan_${angkatan}.csv`);
            return res.send(csv);
          });
        });
      });
    });
  });
});
}


//Delete Mahasiswa Perangkatan
exports.deleteMahasiswaByAngkatan = (req, res) => {
  const angkatan = req.params.angkatan;
  const sqlGetMhsIds = `SELECT id FROM mahasiswa WHERE angkatan = ?`;

  db.query(sqlGetMhsIds, [angkatan], (err, mhsRows) => {
    if (err || !mhsRows.length) return res.status(404).json({ error: 'Tidak ada mahasiswa ditemukan' });

    const mhsIds = mhsRows.map(m => m.id);

    db.beginTransaction(err => {
      if (err) return res.status(500).json({ error: 'Gagal memulai transaksi', detail: err });

      const queries = [
        {
          sql: `DELETE st FROM skripsi_tahap st 
                JOIN skripsi s ON st.skripsi_id = s.id 
                WHERE s.mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE FROM skripsi WHERE mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE mm FROM matakuliah_magang mm 
                JOIN magang m ON mm.magang_id = m.id 
                WHERE m.mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE FROM magang WHERE mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE FROM kp WHERE mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id IN (?)`,
          values: [mhsIds]
        },
        {
          sql: `DELETE FROM mahasiswa WHERE id IN (?)`,
          values: [mhsIds]
        }
      ];

      const executeQueries = (index = 0) => {
        if (index >= queries.length) {
          return db.commit(errCommit => {
            if (errCommit) {
              return db.rollback(() => res.status(500).json({ error: 'Gagal commit transaksi', detail: errCommit }));
            }
            res.json({ message: `Mahasiswa angkatan ${angkatan} berhasil dihapus beserta relasinya.` });
          });
        }

        const { sql, values } = queries[index];
        db.query(sql, values, (err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ error: 'Gagal eksekusi query', detail: err }));
          }
          executeQueries(index + 1);
        });
      };

      executeQueries();
    });
  });
};
