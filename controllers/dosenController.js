// controllers/dosenController.js
const Dosen = require('../models/dosenModel');
const db = require('../config/db'); // Pastikan ini adalah koneksi database Anda

// GET semua dosen
exports.getAllDosen = (req, res) => {
  Dosen.getAllDosen((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// GET semua dosen
exports.getAllDosen = (req, res) => {
  Dosen.getAllDosen((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// POST tambah dosen baru
// POST tambah dosen baru + otomatis buat akun user
exports.createDosen = (req, res) => {
  const { nip, nama } = req.body;

  if (!nip || !nama) {
    return res.status(400).json({ error: 'NIP dan nama wajib diisi' });
  }

  // Cek apakah NIP sudah ada
  Dosen.isNipExists(nip, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'NIP sudah digunakan, harus unik' });

    // Tambah dosen baru
    Dosen.createDosen({ nip, nama }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const dosenId = result.insertId;
      const defaultUsername = nip;
      const defaultPassword = nip.slice(-5); // 5 digit terakhir

      // Tambahkan juga ke tabel users
      const sqlUser = 'INSERT INTO users (username, password, role, dosen_id) VALUES (?, ?, "dosen", ?)';
      db.query(sqlUser, [defaultUsername, defaultPassword, dosenId], (err2) => {
        if (err2) {
          return res.status(500).json({ 
            message: 'Dosen berhasil ditambahkan, tapi gagal membuat akun user',
            error: err2.message
          });
        }

        res.status(201).json({
          message: 'Dosen dan akun user berhasil ditambahkan',
          data: {
            id: dosenId,
            nip,
            nama,
            akun_user: {
              username: defaultUsername,
              password: defaultPassword
            }
          }
        });
      });
    });
  });
};


// PUT update dosen by id
exports.updateDosen = (req, res) => {
  const { id } = req.params;
  const { nip, nama } = req.body;

  // Cek apakah NIP sudah ada, kecuali untuk dosen dengan id yang sedang diupdate
  Dosen.isNipExistsExcludeId(nip, id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'NIP sudah digunakan oleh dosen lain, harus unik' });

    // Update dosen
    Dosen.updateDosen(id, req.body, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Dosen berhasil diperbarui', id });
    });
  });
};

// DELETE dosen by id
exports.deleteDosen = (req, res) => {
  const { id } = req.params;

  Dosen.deleteDosen(id, (err, results) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    res.json({ message: 'Dosen dan akun user berhasil dihapus', id });
  });
};


//Detail Dosen
exports.getDosenDetailFull = async (req, res) => {
  try {
    const id = req.params.id;
    const Dosen = require('../models/dosenModel');

    const data = await Dosen.getDosenDetailFull(id);
    if (!data) return res.status(404).json({ error: 'Dosen tidak ditemukan' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//Statistik Dosen
exports.getStatistikDosen = (req, res) => {
  const { from, to } = req.query; // contoh: ?from=2020&to=2025
  const Dosen = require('../models/dosenModel');
  Dosen.getStatistikPerDosenPerAngkatan({ from, to }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // reshape: grup per dosen, list angkatan desc
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.dosen_id)) {
        map.set(r.dosen_id, { dosen_id: r.dosen_id, nama_dosen: r.nama_dosen, angkatan: [] });
      }
      map.get(r.dosen_id).angkatan.push({
        tahun: Number(r.tahun),
        bimbingan_pa: Number(r.bimbingan_pa),
        bimbingan_ta: Number(r.bimbingan_ta),
        mahasiswa_diuji: Number(r.mahasiswa_diuji)
      });
    }
    res.json(Array.from(map.values()));
  });
};



//Dosen Dashboard


// Tambahkan ini di bagian paling bawah file:
// Tambahkan ini di bagian paling bawah file:
// Tambahkan ini di bagian paling bawah file:
exports.getMahasiswaPAFull = (req, res) => {
  const { angkatan } = req.query;
  const dosenId = req.user.dosen_id;
  if (!dosenId) return res.status(403).json({ message: "Akses hanya untuk dosen" });

  const sqlMhs = `
    SELECT id, nim, nama, angkatan, tanggal_lahir, no_telp, no_telp_ortu, alamat
    FROM mahasiswa
    WHERE dosen_pa_id = ?
    ${angkatan ? 'AND angkatan = ?' : ''}
  `;

  const params = angkatan ? [dosenId, angkatan] : [dosenId];
  db.query(sqlMhs, params, (errMhs, mahasiswa) => {
    if (errMhs) return res.status(500).json({ message: "Gagal ambil mahasiswa", error: errMhs });
    if (!mahasiswa.length) return res.json({ message: "Tidak ada mahasiswa bimbingan PA", data: [] });

    const mhsIds = mahasiswa.map(m => m.id);

    const sql = {
      // >>> Perbarui: join kategori agar bisa tampilkan kategori tiap MK
      matkul: `
        SELECT
          mm.mahasiswa_id,
          mk.id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          mk.kategori_id,
          km.nama_kategori
        FROM mahasiswa_matakuliah mm
        JOIN matakuliah mk ON mm.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        WHERE mm.mahasiswa_id IN (?)
      `,

      kp: `
        SELECT kp.*,
          mk.id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          km.nama_kategori,
               d.nama AS nama_dosen_pembimbing_kp, d.nip AS nip_dosen_pembimbing_kp
        FROM kp
        LEFT JOIN matakuliah mk ON kp.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        LEFT JOIN dosen d ON kp.dosen_pembimbing_kp_id = d.id
        WHERE kp.mahasiswa_id IN (?)
      `,

      // Semua magang milik mahasiswa
      magang: `SELECT * FROM magang WHERE mahasiswa_id IN (?)`,

      // Semua mapping konversi magang -> matakuliah (lengkap)
      matkulMagang: `
        SELECT
          mm.*,
          mk.id AS mk_id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          mk.kategori_id,
          km.nama_kategori
        FROM matakuliah_magang mm
        JOIN matakuliah mk ON mm.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        WHERE mm.magang_id IN (SELECT id FROM magang WHERE mahasiswa_id IN (?))
      `,

      skripsi: `
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
      `
    };

    db.query(sql.matkul, [mhsIds], (errMatkul, matkulRows) => {
      if (errMatkul) return res.status(500).json({ message: "Gagal ambil matakuliah", error: errMatkul });

      db.query(sql.kp, [mhsIds], (errKp, kpRows) => {
        if (errKp) return res.status(500).json({ message: "Gagal ambil KP", error: errKp });

        db.query(sql.magang, [mhsIds], (errMagang, magangRows) => {
          if (errMagang) return res.status(500).json({ message: "Gagal ambil magang", error: errMagang });

          db.query(sql.matkulMagang, [mhsIds], (errMKMG, mkmgRows) => {
            if (errMKMG) return res.status(500).json({ message: "Gagal ambil matkul magang", error: errMKMG });

            db.query(sql.skripsi, [mhsIds], (errSkripsi, skripsiRows) => {
              if (errSkripsi) return res.status(500).json({ message: "Gagal ambil tahapan skripsi", error: errSkripsi });

              const hasil = mahasiswa.map(mhs => {
                // Matkul lulus (sudah termasuk kurikulum & kategori dari query)
                const matkulMahasiswa = matkulRows.filter(mk => mk.mahasiswa_id === mhs.id);
                const total_sks = matkulMahasiswa.reduce((s, m) => s + (m.sks || 0), 0);
                const jumlah_matakuliah = matkulMahasiswa.length;

                // Semua magang milik mahasiswa
                const magangList = magangRows.filter(m => m.mahasiswa_id === mhs.id);
                const magangIds = magangList.map(m => m.id);

                // Semua mapping konversi untuk semua magang mahasiswa ini
                const mkMagangAll = mkmgRows.filter(m => magangIds.includes(m.magang_id));
                const mkMagangIds = mkMagangAll.map(m => m.matakuliah_id);

                // Pilih magang utama: punya konversi terbanyak, kalau tidak ada ambil terbaru
                let primaryMagang = null;
                if (magangList.length) {
                  const byMagangIdCount = new Map();
                  for (const row of mkMagangAll) {
                    byMagangIdCount.set(row.magang_id, (byMagangIdCount.get(row.magang_id) || 0) + 1);
                  }
                  const magangWithConv = magangList
                    .map(m => ({ m, cnt: byMagangIdCount.get(m.id) || 0 }))
                    .sort((a, b) => b.cnt - a.cnt);

                  if (magangWithConv.length && magangWithConv[0].cnt > 0) {
                    primaryMagang = magangWithConv[0].m;
                  } else {
                    primaryMagang = [...magangList].sort(
                      (a, b) => new Date(b.tgl_selesai || 0) - new Date(a.tgl_selesai || 0)
                    )[0] || null;
                  }
                }

                const mkMagangForPrimary = primaryMagang
                  ? mkmgRows.filter(m => m.magang_id === primaryMagang.id)
                  : [];

                // >>> SET: detail lengkap per MK lulus + kategori + flag konversi
                const matakuliah_lulus = matkulMahasiswa.map(mk => ({
                  id: mk.id,
                  kode_mk: mk.kode_mk,
                  nama_mk: mk.nama_mk,
                  sks: mk.sks,
                  kurikulum: mk.kurikulum,
                  kategori: mk.nama_kategori,
                  konversi_magang: mkMagangIds.includes(mk.id) ? "Konversi Magang" : undefined
                }));

                // Data KP dari tabel KP
                const kp = kpRows.find(k => k.mahasiswa_id === mhs.id);

                // KP hasil konversi dari magang (kategori_id = 3 = Kerja Praktek)
                const matkulKPdariMagang = mkMagangAll.filter(mk => mk.kategori_id === 3);

                const kp_detail = (kp || matkulKPdariMagang.length > 0) ? {
                  ...(kp ? {
                    tempat_kp: kp.tempat_kp,
                    tanggal_mulai: kp.tgl_mulai,
                    tanggal_selesai: kp.tgl_selesai,
                    dosen_pembimbing_kp: {
                      id: kp.dosen_pembimbing_kp_id,
                      nip: kp.nip_dosen_pembimbing_kp,
                      nama: kp.nama_dosen_pembimbing_kp
                    },
                    supervisor: kp.nama_supervisor,
                    matakuliah: kp.matakuliah_id ? {
                      id: kp.matakuliah_id,
                      kode_mk : kp.kode_mk,
                      nama_mk: kp.nama_mk,
                      sks : kp.sks,
                      kurkulum : kp.kurikulum,
                      kategori: kp.nama_kategori,
                      konversi_magang: mkMagangIds.includes(kp.matakuliah_id) ? "Konversi Magang" : undefined
                    } : null
                  } : {}),
                  ...(matkulKPdariMagang.length > 0 ? {
                    status_kp: "Sudah dikonversi melalui magang",
                    matakuliah_kp_terkonversi: matkulKPdariMagang.map(m => ({
                      id: m.matakuliah_id,
                      kode_mk: m.kode_mk,
                      nama_mk: m.nama_mk,
                      sks: m.sks,
                      kurikulum: m.kurikulum,
                      kategori: m.nama_kategori
                    }))
                  } : {})
                } : null;

                const magang_detail = primaryMagang ? {
                  tempat_magang: primaryMagang.tempat_magang,
                  tanggal_mulai: primaryMagang.tgl_mulai,
                  tanggal_selesai: primaryMagang.tgl_selesai,
                  supervisor: primaryMagang.nama_supervisor,
                  matakuliah_terkonversi: mkMagangForPrimary.map(m => ({
                    id: m.matakuliah_id,
                    kode_mk: m.kode_mk,
                    nama_mk: m.nama_mk,
                    sks: m.sks,
                    kurikulum: m.kurikulum,
                    kategori: m.nama_kategori
                  }))
                } : null;

                const skripsiTahapan = skripsiRows
                  .filter(s => s.mahasiswa_id === mhs.id)
                  .map(s => ({
                    tahap: s.tahap,
                    judul: s.judul,
                    tanggal: s.tanggal,
                    dosen_pembimbing: s.dosen_pembimbing_id ? {
                      id: s.dosen_pembimbing_id,
                      nama: s.nama_pembimbing
                    } : null,
                    penguji_1: s.dosen_penguji_1_id ? {
                      id: s.dosen_penguji_1_id,
                      nama: s.nama_penguji_1
                    } : null,
                    penguji_2: s.dosen_penguji_2_id ? {
                      id: s.dosen_penguji_2_id,
                      nama: s.nama_penguji_2
                    } : null
                  }));

                return {
                  ...mhs,
                  matakuliah_lulus,
                  jumlah_matakuliah,
                  total_sks,
                  kp: kp_detail,
                  magang: magang_detail,
                  tahapan_skripsi: skripsiTahapan
                };
              });

              res.json({
                message: "Data lengkap mahasiswa bimbingan PA berhasil diambil",
                total_mahasiswa: hasil.length,
                data: hasil
              });
            });
          });
        });
      });
    });
  });
};



exports.getMahasiswaBimbinganTA = (req, res) => {
  const { angkatan } = req.query;
  const dosenId = req.user.dosen_id;
  if (!dosenId) return res.status(403).json({ message: "Akses hanya untuk dosen" });

  // Ambil mahasiswa yang tahap skripsinya terakhir & Anda sebagai pembimbing
  const sqlGetFinalStageMahasiswa = `
    SELECT
      m.id AS mahasiswa_id,
      m.nim, m.nama, m.angkatan, m.tanggal_lahir, m.no_telp, m.no_telp_ortu, m.alamat
    FROM skripsi s
    JOIN skripsi_tahap st ON s.id = st.skripsi_id
    JOIN mahasiswa m ON s.mahasiswa_id = m.id
    WHERE st.id IN (
      SELECT MAX(st2.id)
      FROM skripsi s2
      JOIN skripsi_tahap st2 ON s2.id = st2.skripsi_id
      GROUP BY s2.mahasiswa_id
    )
    AND st.dosen_pembimbing_id = ?
    ${angkatan ? 'AND m.angkatan = ?' : ''}
  `;

  const params = angkatan ? [dosenId, angkatan] : [dosenId];

  db.query(sqlGetFinalStageMahasiswa, params, (errMhs, mahasiswa) => {
    if (errMhs) return res.status(500).json({ message: "Gagal ambil mahasiswa bimbingan TA", error: errMhs });
    if (!mahasiswa.length) return res.json({ message: "Tidak ada mahasiswa bimbingan TA", data: [] });

    const mhsIds = mahasiswa.map(m => m.mahasiswa_id);

    const sql = {
      // Matkul lulus + kategori + kurikulum
      matkul: `
        SELECT
          mm.mahasiswa_id,
          mk.id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          mk.kategori_id,
          km.nama_kategori
        FROM mahasiswa_matakuliah mm
        JOIN matakuliah mk ON mm.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        WHERE mm.mahasiswa_id IN (?)
      `,

      // KP + alias supervisor
      kp: `
        SELECT
          kp.*,
          mk.id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          km.nama_kategori,
          d.nama AS nama_dosen_pembimbing_kp,
          d.nip  AS nip_dosen_pembimbing_kp,
          kp.nama_supervisor AS supervisor
        FROM kp
        LEFT JOIN matakuliah mk ON kp.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        LEFT JOIN dosen d ON kp.dosen_pembimbing_kp_id = d.id
        WHERE kp.mahasiswa_id IN (?)
      `,

      // Semua magang milik mahasiswa + alias tanggal & supervisor
      magang: `
        SELECT
          id,
          mahasiswa_id,
          tempat_magang,
          tgl_mulai   AS tanggal_mulai,
          tgl_selesai AS tanggal_selesai,
          nama_supervisor AS supervisor
        FROM magang
        WHERE mahasiswa_id IN (?)
      `,

      // Mapping konversi magang -> matakuliah (detail lengkap)
      matkulMagang: `
        SELECT
          mm.*,
          mk.id AS mk_id,
          mk.kode_mk,
          mk.nama_mk,
          mk.sks,
          mk.kurikulum,
          mk.kategori_id,
          km.nama_kategori
        FROM matakuliah_magang mm
        JOIN matakuliah mk ON mm.matakuliah_id = mk.id
        LEFT JOIN kategori_matakuliah km ON mk.kategori_id = km.id
        WHERE mm.magang_id IN (SELECT id FROM magang WHERE mahasiswa_id IN (?))
      `,

      // Semua tahapan skripsi (untuk ditampilkan di detail)
      skripsi: `
        SELECT
          st.*,
          s.mahasiswa_id,
          dp.nama AS nama_pembimbing,
          d1.nama AS nama_penguji_1,
          d2.nama AS nama_penguji_2
        FROM skripsi s
        JOIN skripsi_tahap st ON s.id = st.skripsi_id
        LEFT JOIN dosen dp ON st.dosen_pembimbing_id = dp.id
        LEFT JOIN dosen d1 ON st.dosen_penguji_1_id = d1.id
        LEFT JOIN dosen d2 ON st.dosen_penguji_2_id = d2.id
        WHERE s.mahasiswa_id IN (?)
      `
    };

    db.query(sql.matkul, [mhsIds], (errMatkul, matkulRows) => {
      if (errMatkul) return res.status(500).json({ message: "Gagal ambil matakuliah", error: errMatkul });

      db.query(sql.kp, [mhsIds], (errKp, kpRows) => {
        if (errKp) return res.status(500).json({ message: "Gagal ambil KP", error: errKp });

        db.query(sql.magang, [mhsIds], (errMagang, magangRows) => {
          if (errMagang) return res.status(500).json({ message: "Gagal ambil magang", error: errMagang });

          db.query(sql.matkulMagang, [mhsIds], (errMKMG, mkmgRows) => {
            if (errMKMG) return res.status(500).json({ message: "Gagal ambil matkul magang", error: errMKMG });

            db.query(sql.skripsi, [mhsIds], (errSkripsi, skripsiRows) => {
              if (errSkripsi) return res.status(500).json({ message: "Gagal ambil tahapan skripsi", error: errSkripsi });

              const hasil = mahasiswa.map(mhs => {
                // 1) Matkul lulus + kategori + flag konversi
                const matkulMahasiswa = matkulRows.filter(mk => mk.mahasiswa_id === mhs.mahasiswa_id);
                const total_sks = matkulMahasiswa.reduce((s, m) => s + (m.sks || 0), 0);
                const jumlah_matakuliah = matkulMahasiswa.length;

                // 2) Semua magang milik mahasiswa ini
                const magangList = magangRows.filter(m => m.mahasiswa_id === mhs.mahasiswa_id);
                const magangIds = magangList.map(m => m.id);

                // 3) Semua konversi MK dari SEMUA magang
                const mkMagangAll = mkmgRows.filter(m => magangIds.includes(m.magang_id));
                const mkMagangIds = mkMagangAll.map(m => m.matakuliah_id);

                // 4) Pilih primary magang (punya konversi terbanyak; kalau tidak ada, paling baru)
                let primaryMagang = null;
                if (magangList.length) {
                  const byMagangIdCount = new Map();
                  for (const row of mkMagangAll) {
                    byMagangIdCount.set(row.magang_id, (byMagangIdCount.get(row.magang_id) || 0) + 1);
                  }
                  const magangWithConv = magangList
                    .map(m => ({ m, cnt: byMagangIdCount.get(m.id) || 0 }))
                    .sort((a, b) => b.cnt - a.cnt);

                  if (magangWithConv.length && magangWithConv[0].cnt > 0) {
                    primaryMagang = magangWithConv[0].m;
                  } else {
                    primaryMagang = [...magangList].sort(
                      (a, b) => new Date(b.tanggal_selesai || 0) - new Date(a.tanggal_selesai || 0)
                    )[0] || null;
                  }
                }

                const mkMagangForPrimary = primaryMagang
                  ? mkmgRows.filter(m => m.magang_id === primaryMagang.id)
                  : [];

                // 5) Bentuk matakuliah_lulus dengan kategori & flag konversi
                const matakuliah_lulus = matkulMahasiswa.map(mk => ({
                  id: mk.id,
                  kode_mk: mk.kode_mk,
                  nama_mk: mk.nama_mk,
                  sks: mk.sks,
                  kurikulum: mk.kurikulum,
                  kategori: mk.nama_kategori,
                  konversi_magang: mkMagangIds.includes(mk.id) ? "Konversi Magang" : undefined
                }));

                // 6) KP dari tabel KP
                const kp = kpRows.find(k => k.mahasiswa_id === mhs.mahasiswa_id);

                // 7) KP hasil konversi dari magang (kategori_id = 3)
                const matkulKPdariMagang = mkMagangAll.filter(mk => mk.kategori_id === 3);

                const kp_detail = (kp || matkulKPdariMagang.length > 0) ? {
                  ...(kp ? {
                    tempat_kp: kp.tempat_kp,
                    tanggal_mulai: kp.tgl_mulai,
                    tanggal_selesai: kp.tgl_selesai,
                    dosen_pembimbing_kp: {
                      id: kp.dosen_pembimbing_kp_id,
                      nip: kp.nip_dosen_pembimbing_kp,
                      nama: kp.nama_dosen_pembimbing_kp
                    },
                    supervisor: kp.supervisor, // alias dari nama_supervisor
                    matakuliah: kp.matakuliah_id ? {
                      id: kp.matakuliah_id,
                      kode_mk : kp.kode_mk,
                      nama_mk: kp.nama_mk,
                      sks : kp.sks,
                      kurkulum : kp.kurikulum,
                      kategori: kp.nama_kategori,
                      konversi_magang: mkMagangIds.includes(kp.matakuliah_id) ? "Konversi Magang" : undefined
                    } : null
                  } : {}),
                  ...(matkulKPdariMagang.length > 0 ? {
                    status_kp: "Sudah dikonversi melalui magang",
                    matakuliah_kp_terkonversi: matkulKPdariMagang.map(m => ({
                      id: m.matakuliah_id,
                      kode_mk: m.kode_mk,
                      nama_mk: m.nama_mk,
                      sks: m.sks,
                      kurikulum: m.kurikulum,
                      kategori: m.nama_kategori
                    }))
                  } : {})
                } : null;

                // 8) Detail magang (primary) + daftar MK terkonversi
                const magang_detail = primaryMagang ? {
                  tempat_magang: primaryMagang.tempat_magang,
                  tanggal_mulai: primaryMagang.tanggal_mulai,
                  tanggal_selesai: primaryMagang.tanggal_selesai,
                  supervisor: primaryMagang.supervisor,
                  matakuliah_terkonversi: mkMagangForPrimary.map(m => ({
                    id: m.matakuliah_id,
                    kode_mk: m.kode_mk,
                    nama_mk: m.nama_mk,
                    sks: m.sks,
                    kurikulum: m.kurikulum,
                    kategori: m.nama_kategori
                  }))
                } : null;

                // 9) Tahapan skripsi
                const skripsiTahapan = skripsiRows
                  .filter(s => s.mahasiswa_id === mhs.mahasiswa_id)
                  .map(s => ({
                    tahap: s.tahap,
                    judul: s.judul,
                    tanggal: s.tanggal,
                    dosen_pembimbing: s.dosen_pembimbing_id
                      ? { id: s.dosen_pembimbing_id, nama: s.nama_pembimbing }
                      : null,
                    penguji_1: s.dosen_penguji_1_id
                      ? { id: s.dosen_penguji_1_id, nama: s.nama_penguji_1 }
                      : null,
                    penguji_2: s.dosen_penguji_2_id
                      ? { id: s.dosen_penguji_2_id, nama: s.nama_penguji_2 }
                      : null
                  }));

                return {
                  ...mhs,
                  id: mhs.mahasiswa_id,
                  matakuliah_lulus,
                  jumlah_matakuliah,
                  total_sks,
                  kp: kp_detail,
                  magang: magang_detail,
                  tahapan_skripsi: skripsiTahapan
                };
              });

              res.json({
                message: "Data lengkap mahasiswa bimbingan TA berhasil diambil",
                total_mahasiswa: hasil.length,
                data: hasil
              });
            });
          });
        });
      });
    });
  });
};


//List Mahasiswa Penguji
exports.getMahasiswaPengujian = (req, res) => {
  const { angkatan } = req.query;
  const dosenId = req.user.dosen_id;
  if (!dosenId) return res.status(403).json({ message: "Akses hanya untuk dosen" });

  const sqlGetFinalStageMahasiswaPenguji = `
    SELECT m.id AS mahasiswa_id, m.nim, m.nama, m.angkatan, m.tanggal_lahir, m.no_telp, m.no_telp_ortu, m.alamat,
           st.tahap, st.judul, st.tanggal,
           s.id AS skripsi_id,
           CASE
             WHEN st.dosen_penguji_1_id = ? THEN 'penguji_1'
             WHEN st.dosen_penguji_2_id = ? THEN 'penguji_2'
           END AS peran
    FROM skripsi s
    JOIN skripsi_tahap st ON s.id = st.skripsi_id
    JOIN mahasiswa m ON s.mahasiswa_id = m.id
    WHERE st.id IN (
      SELECT MAX(st2.id)
      FROM skripsi s2
      JOIN skripsi_tahap st2 ON s2.id = st2.skripsi_id
      GROUP BY s2.mahasiswa_id
    )
    AND (st.dosen_penguji_1_id = ? OR st.dosen_penguji_2_id = ?)
    ${angkatan ? 'AND m.angkatan = ?' : ''}

  `;
const params = angkatan ? [dosenId, dosenId, dosenId, dosenId, angkatan] : [dosenId, dosenId, dosenId, dosenId];
  db.query(sqlGetFinalStageMahasiswaPenguji, params, (errMhs, mahasiswa) => {
    if (errMhs) return res.status(500).json({ message: "Gagal ambil mahasiswa pengujian", error: errMhs });
    if (!mahasiswa.length) return res.json({ message: "Tidak ada mahasiswa yang diuji", penguji_1: [], penguji_2: [] });

    const penguji1 = mahasiswa.filter(m => m.peran === 'penguji_1');
    const penguji2 = mahasiswa.filter(m => m.peran === 'penguji_2');

    res.json({
      message: "Data mahasiswa yang diuji berhasil diambil",
      total_mahasiswa : penguji1.length + penguji2.length,
      penguji_1: {
        mahasiswa_jumlah: penguji1.length,
        mahasiswa : penguji1,
      },
      penguji_2: {
        mahasiswa_jumlah: penguji2.length,
        mahasiswa : penguji2
      }
    });
  });
};
