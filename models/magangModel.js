const db = require('../config/db');


// magangModel.js
exports.addMagang = (
  mahasiswa_id,
  tempat_magang,
  tgl_mulai,
  tgl_selesai,
  nama_supervisor,
  matakuliah_ids,
  callback
) => {
  const db = require('../config/db');

  // Mulai transaksi agar atomic
  db.beginTransaction(err => {
    if (err) return callback(err);

    const queryCekMatakuliahKP = `
      SELECT m.id
      FROM matakuliah m
      JOIN mahasiswa_matakuliah mm ON mm.matakuliah_id = m.id
      WHERE mm.mahasiswa_id = ? AND m.kategori_id = 3
    `;
    db.query(queryCekMatakuliahKP, [mahasiswa_id], (err, rowsKPExisting) => {
      if (err) return db.rollback(() => callback(err));
      const mahasiswaSudahLulusKP = rowsKPExisting.length > 0;

      // Ambil detail MK yang ingin dikonversi
      const qDetail = `
        SELECT 
          m.id, m.nama_mk, m.kategori_id,
          CASE WHEN mm.matakuliah_id IS NOT NULL THEN 1 ELSE 0 END AS sudah_dilulusi
        FROM matakuliah m
        LEFT JOIN mahasiswa_matakuliah mm
          ON mm.matakuliah_id = m.id AND mm.mahasiswa_id = ?
        WHERE m.id IN (?)
      `;
      db.query(qDetail, [mahasiswa_id, matakuliah_ids], (err, rows) => {
        if (err) return db.rollback(() => callback(err));

        // Validasi id yang tidak ditemukan
        const foundIds = rows.map(r => r.id);
        const invalidIds = matakuliah_ids.filter(id => !foundIds.includes(id));
        if (invalidIds.length > 0) {
          return db.rollback(() => callback(null, {
            invalids: invalidIds.map(id => ({ id, reason: 'Matakuliah tidak ditemukan di database' }))
          }));
        }

        const invalids = [];
        const kategoriKP = [];

        rows.forEach(row => {
          if (row.kategori_id === 4) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Kategori Seminar Hasil tidak boleh dikonversi' });
          }
          if (row.kategori_id === 5) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Kategori Skripsi tidak boleh dikonversi' });
          }
          if (row.kategori_id === 3) {
            kategoriKP.push(row.id);
            if (mahasiswaSudahLulusKP) {
              invalids.push({
                id: row.id,
                nama_mk: row.nama_mk,
                reason: 'Mahasiswa sudah pernah melulusi matakuliah kategori KP. Tidak boleh konversi KP lagi.'
              });
            }
          }
          if (row.sudah_dilulusi) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Matakuliah sudah dilulusi' });
          }
        });

        // ❗ VALIDASI BARU: dalam satu request, maksimal 1 MK KP
        if (kategoriKP.length > 1) {
          kategoriKP.slice(1).forEach((id) => {
            const mk = rows.find(r => r.id === id);
            invalids.push({
              id: mk.id,
              nama_mk: mk.nama_mk,
              reason: 'Hanya boleh satu (1) matakuliah kategori KP dalam satu pengajuan.'
            });
          });
        }

        if (invalids.length > 0) {
          return db.rollback(() => callback(null, { invalids }));
        }

        // Cek pernah konversi KP via magang sebelumnya
        const hasKPInRequest = kategoriKP.length === 1;
        const lanjutInsert = () => insertMagang();

        if (hasKPInRequest) {
          const qCekKPviaMagang = `
            SELECT 1
            FROM matakuliah_magang mm
            JOIN matakuliah m ON m.id = mm.matakuliah_id
            WHERE mm.magang_id IN (SELECT id FROM magang WHERE mahasiswa_id = ?) 
              AND m.kategori_id = 3
            LIMIT 1
          `;
          db.query(qCekKPviaMagang, [mahasiswa_id], (err, kpRows) => {
            if (err) return db.rollback(() => callback(err));
            if (kpRows.length > 0) {
              const mk = rows.find(r => r.id === kategoriKP[0]);
              return db.rollback(() => callback(null, {
                invalids: [{
                  id: mk.id,
                  nama_mk: mk?.nama_mk,
                  reason: 'Matakuliah KP sudah pernah dikonversi sebelumnya via Magang.'
                }]
              }));
            }
            lanjutInsert();
          });
        } else {
          lanjutInsert();
        }

        function insertMagang() {
          const qMagang = `
            INSERT INTO magang (mahasiswa_id, tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.query(qMagang, [mahasiswa_id, tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor], (err, result) => {
            if (err) return db.rollback(() => callback(err));
            const magang_id = result.insertId;

            const qRelasi = 'INSERT INTO matakuliah_magang (magang_id, matakuliah_id) VALUES ?';
            const relasiVals = matakuliah_ids.map(id => [magang_id, id]);

            db.query(qRelasi, [relasiVals], (err) => {
              if (err) return db.rollback(() => callback(err));

              const qMhs = 'INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES ?';
              const mhsVals = matakuliah_ids.map(id => [mahasiswa_id, id]);
              db.query(qMhs, [mhsVals], (err) => {
                if (err) return db.rollback(() => callback(err));
                db.commit(err => {
                  if (err) return db.rollback(() => callback(err));
                  callback(null, { magang_id });
                });
              });
            });
          });
        }
      });
    });
  });
};





// models/magangModel.js
exports.updateMagang = (
  magang_id,
  tempat_magang,
  tgl_mulai,
  tgl_selesai,
  nama_supervisor,
  matakuliah_ids,
  callback
) => {
  const db = require('../config/db');

  // Ambil mahasiswa_id & daftar matakuliah lama pada magang ini
  const qGetHeader = 'SELECT mahasiswa_id FROM magang WHERE id = ?';
  const qGetOldMK  = `
    SELECT mm.matakuliah_id, m.kategori_id
    FROM matakuliah_magang mm
    JOIN matakuliah m ON m.id = mm.matakuliah_id
    WHERE mm.magang_id = ?
  `;

  db.query(qGetHeader, [magang_id], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) return callback(new Error('Data magang tidak ditemukan.'));
    const mahasiswa_id = rows[0].mahasiswa_id;

    db.query(qGetOldMK, [magang_id], (err, oldRows) => {
      if (err) return callback(err);

      const oldMatkulIds = oldRows.map(r => r.matakuliah_id);
      const oldKPIdsInThisMagang = oldRows.filter(r => r.kategori_id === 3).map(r => r.matakuliah_id);

      // Ambil detail matakuliah baru yang diminta
      const qDetailNew = `
        SELECT 
          m.id,
          m.nama_mk,
          m.kategori_id,
          CASE WHEN mm.matakuliah_id IS NOT NULL THEN 1 ELSE 0 END AS sudah_dilulusi
        FROM matakuliah m
        LEFT JOIN mahasiswa_matakuliah mm
          ON mm.matakuliah_id = m.id AND mm.mahasiswa_id = ?
        WHERE m.id IN (?)
      `;
      db.query(qDetailNew, [mahasiswa_id, matakuliah_ids], (err, newRows) => {
        if (err) return callback(err);

        // Validasi ID tidak ditemukan
        const foundIds = newRows.map(r => r.id);
        const invalidIds = matakuliah_ids.filter(id => !foundIds.includes(id));
        if (invalidIds.length > 0) {
          return callback(null, {
            invalids: invalidIds.map(id => ({
              id,
              reason: 'Matakuliah tidak ditemukan di database'
            }))
          });
        }

        const invalids = [];

        // 1) Larang kategori tertentu, kumpulkan calon KP
        const newKPIds = [];
        for (const row of newRows) {
          if (row.kategori_id === 4) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Kategori Seminar Hasil tidak boleh dikonversi' });
          }
          if (row.kategori_id === 5) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Kategori Skripsi tidak boleh dikonversi' });
          }
          if (row.kategori_id === 3) {
            newKPIds.push(row.id);
          }

          // 2) Tolak matakuliah yang sudah dilulusi, KECUALI jika termasuk matkul lama pada magang ini
          // (karena kita akan hapus relasi lama lalu sisipkan yang baru)
          if (row.sudah_dilulusi && !oldMatkulIds.includes(row.id)) {
            invalids.push({ id: row.id, nama_mk: row.nama_mk, reason: 'Matakuliah sudah dilulusi' });
          }
        }

        // 3) Batasi jumlah KP dalam satu update (maks 1)
        if (newKPIds.length > 1) {
          invalids.push({
            id: newKPIds[0],
            nama_mk: newRows.find(r => r.id === newKPIds[0])?.nama_mk,
            reason: 'Hanya boleh memilih satu matakuliah kategori KP pada satu magang'
          });
        }

        if (invalids.length > 0) {
          return callback(null, { invalids });
        }

        // 4) Cek KP yang sudah pernah dikonversi via MAGANG lain (selain magang ini)
        const qOtherMagangKP = `
          SELECT mm.matakuliah_id
          FROM matakuliah_magang mm
          JOIN magang g ON g.id = mm.magang_id
          JOIN matakuliah m ON m.id = mm.matakuliah_id
          WHERE g.mahasiswa_id = ? AND g.id != ? AND m.kategori_id = 3
          LIMIT 1
        `;
        db.query(qOtherMagangKP, [mahasiswa_id, magang_id], (err, otherKPRows) => {
          if (err) return callback(err);

          const hasKPInOtherMagang = otherKPRows.length > 0;

          // 5) Cek "sudah lulus KP" di tabel mahasiswa_matakuliah yang TIDAK berasal dari magang ini
          //    (artinya KP lulus dari sumber lain / magang lain)
          const qLulusKPLuarMagangIni = `
            SELECT m.id
            FROM matakuliah m
            JOIN mahasiswa_matakuliah mm ON mm.matakuliah_id = m.id
            WHERE mm.mahasiswa_id = ?
              AND m.kategori_id = 3
              AND m.id NOT IN (?)  -- exclude KP lama pada magang ini
            LIMIT 1
          `;
          const excludeList = oldKPIdsInThisMagang.length ? oldKPIdsInThisMagang : [0]; // agar IN (?) valid
          db.query(qLulusKPLuarMagangIni, [mahasiswa_id, excludeList], (err, lulusKPLuar) => {
            if (err) return callback(err);

            const hasGraduatedKPOutsider = lulusKPLuar.length > 0;

            // 6) Aturan global: total KP via magang untuk satu mahasiswa maksimal 1
            //    - Jika di magang lain sudah ada KP -> tidak boleh menambah KP baru di sini
            //    - Ganti KP pada magang ini diperbolehkan (replace), karena relasi lama akan dihapus dulu
            if (newKPIds.length > 0) {
              // Ada KP yang diminta di update ini
              if (hasKPInOtherMagang || hasGraduatedKPOutsider) {
                // Ada KP dari magang lain / sumber luar magang ini -> TOLAK
                const mk = newRows.find(r => r.id === newKPIds[0]);
                invalids.push({
                  id: mk.id,
                  nama_mk: mk.nama_mk,
                  reason: 'Mahasiswa sudah memiliki konversi/lulus KP dari sumber lain. Tidak boleh menambah KP lagi.'
                });
              }
            } else {
              // Tidak memilih KP baru — ini juga valid (mis. ingin menghapus KP dari magang ini)
              // Tidak ada aturan yang dilanggar di sini
            }

            if (invalids.length > 0) {
              return callback(null, { invalids });
            }

            // 7) Lakukan UPDATE:
            //    - Hapus relasi matakuliah_magang lama
            //    - Hapus relasi mahasiswa_matakuliah lama untuk matkul lama pada magang ini
            //    - Update header magang
            //    - Insert relasi baru ke matakuliah_magang & mahasiswa_matakuliah
            const qDelMagangMK = 'DELETE FROM matakuliah_magang WHERE magang_id = ?';
            const qDelMhsMK = oldMatkulIds.length
              ? 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id IN (?)'
              : null;

            db.query(qDelMagangMK, [magang_id], (err) => {
              if (err) return callback(err);

              const continueAfterDeleteMhsMK = () => {
                const qUpdateHeader = `
                  UPDATE magang SET
                    tempat_magang = ?,
                    tgl_mulai = ?,
                    tgl_selesai = ?,
                    nama_supervisor = ?
                  WHERE id = ?
                `;
                const headerVals = [tempat_magang, tgl_mulai, tgl_selesai, nama_supervisor, magang_id];

                db.query(qUpdateHeader, headerVals, (err) => {
                  if (err) return callback(err);

                  if (!matakuliah_ids.length) {
                    // Tidak ada matkul baru (hanya update header)
                    return callback(null, { updated: true });
                  }

                  const qInsMagangMK = 'INSERT INTO matakuliah_magang (magang_id, matakuliah_id) VALUES ?';
                  const relasiVals = matakuliah_ids.map(id => [magang_id, id]);

                  db.query(qInsMagangMK, [relasiVals], (err) => {
                    if (err) return callback(err);

                    const qInsMhsMK = 'INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES ?';
                    const mhsVals = matakuliah_ids.map(id => [mahasiswa_id, id]);

                    db.query(qInsMhsMK, [mhsVals], (err) => {
                      if (err) return callback(err);
                      callback(null, { updated: true });
                    });
                  });
                });
              };

              if (qDelMhsMK) {
                db.query(qDelMhsMK, [mahasiswa_id, oldMatkulIds], (err) => {
                  if (err) return callback(err);
                  continueAfterDeleteMhsMK();
                });
              } else {
                continueAfterDeleteMhsMK();
              }
            });
          });
        });
      });
    });
  });
};



// Fungsi untuk memeriksa apakah matakuliah kategori "Kerja Praktek" sudah pernah dikonversi sebelumnya
exports.isMatakuliahKerjaPraktekAlreadyConverted = (mahasiswa_id, matakuliah_ids, callback) => {
  // Mengecek apakah ada matakuliah dengan kategori Kerja Praktek yang sudah pernah dikonversi untuk mahasiswa ini
  const query = `
    SELECT mm.matakuliah_id
    FROM matakuliah_magang mm
    JOIN matakuliah m ON m.id = mm.matakuliah_id
    WHERE mm.magang_id IN (SELECT magang_id FROM magang WHERE mahasiswa_id = ?)
    AND m.kategori_id = 3  -- Kerja Praktek
    AND mm.matakuliah_id IN (?)
  `;
  db.query(query, [mahasiswa_id, matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      // Mengembalikan hasil jika ada matakuliah kategori Kerja Praktek yang sudah dikonversi
      callback(null, results);
    }
  });
};





// Fungsi untuk mendapatkan detail magang beserta matakuliah yang dikonversi
exports.getDetailMagang = (mahasiswa_id, callback) => {
  const query = `
    SELECT 
      mg.id AS magang_id,
      mg.tempat_magang,
      mg.tgl_mulai,
      mg.tgl_selesai,
      mg.nama_supervisor,
      mm.matakuliah_id,
      m.nama_mk,
      m.sks,
      m.kurikulum,
      m.kode_mk,
      km.nama_kategori
    FROM magang mg
    JOIN matakuliah_magang mm ON mm.magang_id = mg.id
    JOIN matakuliah m ON m.id = mm.matakuliah_id
    LEFT JOIN kategori_matakuliah km ON km.id = m.kategori_id
    WHERE mg.mahasiswa_id = ?
  `;

  db.query(query, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      // Menyusun data dalam bentuk yang diinginkan
      const magangDetail = results.reduce((acc, row) => {
        // Memeriksa apakah magang_id sudah ada dalam accumulator
        let magang = acc.find(item => item.magang_id === row.magang_id);

        if (!magang) {
          magang = {
            magang_id: row.magang_id,
            tempat_magang: row.tempat_magang,
            tgl_mulai: row.tgl_mulai,
            tgl_selesai: row.tgl_selesai,
            nama_supervisor: row.nama_supervisor,
            matakuliah: []
          };
          acc.push(magang);
        }

        // Menambahkan matakuliah ke dalam array matakuliah
        magang.matakuliah.push({
          matakuliah_id: row.matakuliah_id,
          kode_mk : row.kode_mk,
          nama_mk: row.nama_mk,
          sks: row.sks,
          kurikulum: row.kurikulum,
          nama_kategori: row.nama_kategori
          
        });

        return acc;
      }, []);

      callback(null, magangDetail); // Mengembalikan detail magang
    }
  });
};


// Fungsi untuk menghapus magang dan matakuliah yang dikonversi
exports.deleteMagang = (mahasiswa_id, callback) => {
  const queryMagang = 'DELETE FROM magang WHERE mahasiswa_id = ?';
  db.query(queryMagang, [mahasiswa_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      const queryMatakuliah = 'DELETE FROM matakuliah_magang WHERE magang_id = ?';
      db.query(queryMatakuliah, [results.insertId], (err, matakuliahResults) => {
        if (err) {
          callback(err, null);
        } else {
          // Menghapus matakuliah yang dilulusi mahasiswa di mahasiswa_matakuliah
          const queryDeleteMatakuliahMahasiswa = 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id IN (SELECT matakuliah_id FROM matakuliah_magang WHERE magang_id = ?)';
          
          db.query(queryDeleteMatakuliahMahasiswa, [mahasiswa_id, results.insertId], (err, deleteResults) => {
            if (err) {
              callback(err, null);
            } else {
              callback(null, deleteResults);  // Mengembalikan hasil penghapusan
            }
          });
        }
      });
    }
  });
};


// Fungsi untuk memeriksa apakah matakuliah sudah dilulusi
exports.isMatakuliahDilulusi = (mahasiswa_id, matakuliah_ids, callback) => {
  const query = 'SELECT matakuliah_id FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id IN (?)';
  db.query(query, [mahasiswa_id, matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan matakuliah yang sudah dilulusi
    }
  });
};

// Fungsi untuk memeriksa apakah matakuliah sudah ada di matakuliah_magang
exports.isMatakuliahAlreadyConverted = (matakuliah_ids, callback) => {
  const query = 'SELECT matakuliah_id FROM matakuliah_magang WHERE matakuliah_id IN (?)';
  db.query(query, [matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan matakuliah yang sudah dikonversi
    }
  });
};

// Fungsi untuk memeriksa apakah matakuliah termasuk kategori "Seminar Hasil" atau "Skripsi"
exports.isMatakuliahKategoriKP = (matakuliah_ids, callback) => {
  const query = `
    SELECT id 
    FROM matakuliah 
    WHERE id IN (?) AND kategori_id IN (4, 5)
  `;
  db.query(query, [matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan matakuliah yang termasuk kategori Seminar Hasil atau Skripsi
    }
  });
};

// Fungsi untuk mengambil semua matakuliah yang dikonversi untuk magang tertentu
exports.getMatakuliahByMagang = (magang_id, callback) => {
  const query = `
    SELECT mm.matakuliah_id
    FROM matakuliah_magang mm
    WHERE mm.magang_id = ?
  `;
  db.query(query, [magang_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan semua matakuliah_id yang dikonversi untuk magang ini
    }
  });
};

// Fungsi untuk menghapus data magang berdasarkan ID magang
exports.deleteMagangById = (magang_id, callback) => {
  const query = 'DELETE FROM magang WHERE id = ?';
  db.query(query, [magang_id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Fungsi untuk menghapus beberapa matakuliah yang sudah diluluskan mahasiswa
exports.removeMatakuliahBatch = (mahasiswa_id, matakuliah_ids, callback) => {
  const query = 'DELETE FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id IN (?)';
  db.query(query, [mahasiswa_id, matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Fungsi untuk menghapus relasi antara magang dan matakuliah
exports.deleteMatakuliahMagang = (magang_id, callback) => {
  const query = 'DELETE FROM matakuliah_magang WHERE magang_id = ?';
  db.query(query, [magang_id], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};


// Fungsi untuk mengambil matakuliah berdasarkan ID
exports.getMatakuliahByIds = (matakuliah_ids, callback) => {
  const query = 'SELECT id, kode_mk, nama_mk, sks, kurikulum, kategori_id FROM matakuliah WHERE id IN (?)';
  db.query(query, [matakuliah_ids], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);  // Mengembalikan hasil matakuliah berdasarkan ID
    }
  });
};
