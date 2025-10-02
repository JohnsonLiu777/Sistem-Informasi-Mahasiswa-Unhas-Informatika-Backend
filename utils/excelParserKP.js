const xlsx = require('xlsx');
const db = require('../config/db');

// Fungsi untuk memeriksa apakah mahasiswa ada di database berdasarkan NIM
const getMahasiswaByNim = async (nim) => {
  const [rows] = await db.promise().query('SELECT id, nama FROM mahasiswa WHERE nim = ?', [nim]);
  return rows.length ? rows[0] : null;
};

// Fungsi untuk memeriksa apakah dosen ada di database berdasarkan NIP
const getDosenByNip = async (nip) => {
  const [rows] = await db.promise().query('SELECT id, nama FROM dosen WHERE nip = ?', [nip]);
  return rows.length ? rows[0] : null;
};

// Fungsi untuk memeriksa apakah KP sudah ada untuk mahasiswa tertentu
const isKPExists = async (mahasiswa_id) => {
  const [rows] = await db.promise().query('SELECT * FROM kp WHERE mahasiswa_id = ?', [mahasiswa_id]);
  return rows.length > 0;
};


const updateKP = async (mahasiswa_id, data) => {
  const sql = `
    UPDATE kp
    SET tempat_kp = ?, tgl_mulai = ?, tgl_selesai = ?, dosen_pembimbing_kp_id = ?, nama_supervisor = ?, status_kp = ?
    WHERE mahasiswa_id = ?
  `;
  
  // Melakukan update KP jika ada perubahan pada data
  const [result] = await db.promise().query(sql, [
    data.tempat_kp,
    data.tgl_mulai,
    data.tgl_selesai,
    data.dosen_pembimbing_kp_id,
    data.nama_supervisor || null,
    data.status_kp,
    mahasiswa_id
  ]);
  
  return result;
};


// Fungsi untuk menambah data KP ke dalam database
const addKP = async (mahasiswa_id, data) => {
  const sql = `
    INSERT INTO kp (mahasiswa_id, tempat_kp, tgl_mulai, tgl_selesai, dosen_pembimbing_kp_id, nama_supervisor, status_kp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.promise().query(sql, [
    mahasiswa_id,
    data.tempat_kp,
    data.tgl_mulai,
    data.tgl_selesai,
    data.dosen_pembimbing_kp_id,
    data.nama_supervisor || null,
    data.status_kp || false,
  ]);
  return result;
};

// Fungsi untuk memproses file Excel dan mengupdate data KP mahasiswa
const parseExcelAndUpdateKP = async (filePath) => {
  const workbook = xlsx.readFile(filePath); // Baca file Excel
  const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Ambil sheet pertama
  const data = xlsx.utils.sheet_to_json(sheet); // Convert sheet ke JSON array

  const results = [];
  const notFoundNimSet = new Set();  // Menyimpan NIM yang sudah error
  const notFoundNipSet = new Set();  // Menyimpan NIP dosen yang sudah error

  for (const row of data) {
    let { nim, tempat_kp, tgl_mulai, tgl_selesai, nip_dosen, nama_supervisor } = row;

    // Fungsi untuk memeriksa dan mengonversi tanggal Excel ke format JS Date
    const parseDate = (date) => {
      if (!date) return null;
      
      // Cek apakah tanggal berupa serial number Excel (misalnya angka)
      if (typeof date === 'number') {
        // Excel serial number untuk tanggal
        return new Date((date - 25569) * 86400 * 1000); // Konversi ke timestamp JS
      }
      
      // Jika sudah dalam format string, coba parsing langsung
      const parsedDate = new Date(date);
      return parsedDate.getTime() ? parsedDate : null; // Pastikan tanggal valid
    };

    // Konversi tgl_mulai dan tgl_selesai
    const tglMulai = parseDate(tgl_mulai);
    const tglSelesai = parseDate(tgl_selesai);

    // Validasi jika data tidak lengkap
    if (!nim || !tempat_kp || !tglMulai || !tglSelesai || !nip_dosen) {
      results.push({ status: 'Gagal', error: 'NIM, Tempat KP, Tanggal Mulai, Tanggal Selesai, dan NIP Dosen wajib diisi' });
      continue;
    }

    // Periksa apakah mahasiswa ada berdasarkan NIM
    const mahasiswa = await getMahasiswaByNim(nim);
    if (!mahasiswa) {
      if (!notFoundNimSet.has(nim)) {
        results.push({ 
          nim: nim,
          status: 'Gagal', 
          error: `Mahasiswa dengan NIM ${nim} tidak ditemukan` 
        });
        notFoundNimSet.add(nim);  // Tambahkan NIM ke set
      }
      continue;
    }

    // Periksa apakah dosen ada berdasarkan NIP
    const dosen = await getDosenByNip(nip_dosen);
    if (!dosen) {
      if (!notFoundNipSet.has(nip_dosen)) {
        results.push({ 
          nim: nim,
          nama_mahasiswa: mahasiswa.nama,
          status: 'Gagal',
          error: `Dosen dengan NIP ${nip_dosen} tidak ditemukan`
        });
        notFoundNipSet.add(nip_dosen);  // Tambahkan NIP ke set
      }
      continue;
    }

    // Cek apakah mahasiswa sudah memiliki data KP
    const kpExists = await isKPExists(mahasiswa.id);

    if (kpExists) {
      // Jika data KP sudah ada, lakukan update data KP
      const updateResult = await updateKP(mahasiswa.id, {
        tempat_kp,
        tgl_mulai: tglMulai, // Gunakan format tanggal yang benar
        tgl_selesai: tglSelesai, // Gunakan format tanggal yang benar
        dosen_pembimbing_kp_id: dosen.id,
        nama_supervisor,
        status_kp: true,  // Set status_kp selalu TRUE (lulus)
      });

      results.push({
        nim: nim,
        nama_mahasiswa: mahasiswa.nama,
        status: 'Berhasil',
        message: 'Data KP berhasil diupdate'
      });
    } else {
      // Jika tidak ada, tambah data KP baru
      const addResult = await addKP(mahasiswa.id, {
        tempat_kp,
        tgl_mulai: tglMulai, // Gunakan format tanggal yang benar
        tgl_selesai: tglSelesai, // Gunakan format tanggal yang benar
        dosen_pembimbing_kp_id: dosen.id,
        nama_supervisor,
        status_kp: true,  // Set status_kp selalu TRUE (lulus)
      });

      results.push({
        nim: nim,
        nama_mahasiswa: mahasiswa.nama,
        status: 'Berhasil',
        message: 'Data KP berhasil ditambahkan'
      });
    }
  }

  return results;
};



module.exports = { parseExcelAndUpdateKP };
