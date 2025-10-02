const xlsx = require('xlsx');
const db = require('../config/db');

// Fungsi untuk memeriksa apakah mahasiswa ada di database
const getMahasiswaByNim = async (nim) => {
  const [rows] = await db.promise().query(`SELECT id, nama FROM mahasiswa WHERE nim = ?`, [nim]);
  return rows.length ? rows[0] : null;
};

// Fungsi untuk memeriksa apakah matakuliah ada di database
const getMatakuliahByKode = async (kode_mk) => {
  const [rows] = await db.promise().query(
    `SELECT id, nama_mk, kategori_id FROM matakuliah WHERE kode_mk = ?`, [kode_mk]
  );
  return rows.length ? rows[0] : null;
};

// Fungsi untuk memeriksa apakah mahasiswa sudah melulusi mata kuliah
const isMatakuliahAlreadyTaken = async (mahasiswa_id, matakuliah_id) => {
  const [rows] = await db.promise().query(
    `SELECT * FROM mahasiswa_matakuliah WHERE mahasiswa_id = ? AND matakuliah_id = ?`,
    [mahasiswa_id, matakuliah_id]
  );
  return rows.length > 0; // Jika ditemukan, berarti mahasiswa sudah melulusi matakuliah tersebut
};

// Fungsi untuk mengupdate matakuliah yang sudah dilulusi mahasiswa
const updateMatakuliahMahasiswa = async (mahasiswa_id, matakuliah_id, matakuliah_nama, kode_mk, kategori_id) => {
   // ✅ Cek apakah sudah pernah dilulusi
  const alreadyTaken = await isMatakuliahAlreadyTaken(mahasiswa_id, matakuliah_id);
  
  if (alreadyTaken) {
    return {
      kode_mk: kode_mk,
      nama_mk: matakuliah_nama,
      status: 'Gagal',
      error: 'Matakuliah sudah diluluskan'
    };
  }
  
  // ⛔️ Blokir kategori tertentu (KP, Seminar, Skripsi)
  if ([3, 4, 5].includes(kategori_id)) {
    return {
      kode_mk: kode_mk,
      nama_mk: matakuliah_nama,
      status: 'Gagal',
      error: `Matakuliah kategori khusus (${kode_mk}) tidak bisa dilulusi dari Excel (KP, Seminar, Skripsi)`
    };
  }

 
  // ✅ Lanjut insert
  await db.promise().query(
    `INSERT INTO mahasiswa_matakuliah (mahasiswa_id, matakuliah_id) VALUES (?, ?)`,
    [mahasiswa_id, matakuliah_id]
  );

  return {
    kode_mk: kode_mk,
    nama_mk: matakuliah_nama,
    status: 'Berhasil'
  };
};


// Fungsi untuk memproses file Excel dan mengupdate data mahasiswa-matakuliah
const parseExcelAndUpdateMatakuliah = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const results = [];
  const notFoundNimSet = new Set();  // Menyimpan NIM yang sudah error

  for (const row of data) {
    const { nim, kode_mk } = row;

    // Validasi jika nim atau kode_mk tidak ada dalam baris
    if (!nim || !kode_mk) {
      results.push({ status: 'Gagal', error: 'NIM dan Kode MK wajib diisi' });
      continue;
    }

    // Periksa apakah mahasiswa dengan NIM tersebut ada
    const mahasiswa = await getMahasiswaByNim(nim);
    if (!mahasiswa) {
      if (!notFoundNimSet.has(nim)) {
        results.push({ status: 'Gagal', error: `Mahasiswa dengan NIM ${nim} tidak ditemukan` });
        notFoundNimSet.add(nim); // Tambahkan NIM ke set
      }
      continue;
    }

    // Periksa apakah matakuliah dengan Kode MK tersebut ada
    const matakuliah = await getMatakuliahByKode(kode_mk);
 if (!matakuliah) {
  // Cek apakah hasil untuk NIM ini sudah ada
  let existingResult = results.find(result => result.nim === nim);

  if (!existingResult) {
    existingResult = { 
      nim: nim, 
      nama_mahasiswa: mahasiswa.nama, 
      matakuliah: [] 
    };
    results.push(existingResult);
  }

  existingResult.matakuliah.push({
    kode_mk: kode_mk,
    status: 'Gagal',
    error: `Matakuliah dengan kode MK ${kode_mk} tersebut tidak ada`
  });

  continue;
}


    // Update matakuliah mahasiswa
    const updateResult = await updateMatakuliahMahasiswa(mahasiswa.id, matakuliah.id, matakuliah.nama_mk, kode_mk,matakuliah.kategori_id);
    
    // Group hasil per NIM
    let existingResult = results.find(result => result.nim === nim);
    if (!existingResult) {
      existingResult = { nim, nama_mahasiswa: mahasiswa.nama, matakuliah: [] };
      results.push(existingResult);
    }

    existingResult.matakuliah.push(updateResult);
  }

  return results;
};



module.exports = { parseExcelAndUpdateMatakuliah };
