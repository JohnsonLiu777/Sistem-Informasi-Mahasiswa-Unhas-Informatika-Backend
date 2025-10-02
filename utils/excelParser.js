const xlsx = require('xlsx');
const db = require('../config/db');

// Fungsi untuk mendapatkan ID dosen berdasarkan NIP
const getDosenIdByNip = async (nip) => {
  const [rows] = await db.promise().query(`SELECT id FROM dosen WHERE nip = ?`, [nip]);
  return rows.length ? rows[0].id : null;
};

// Fungsi untuk mengonversi tanggal yang diterima (baik sebagai serial number atau string) ke format 'YYYY-MM-DD'
const formatTanggalLahir = (rawDate) => {
  let formattedDate = null;

  // Jika tanggal berupa serial number Excel
  if (typeof rawDate === 'number') {
    const dateObj = xlsx.SSF.parse_date_code(rawDate);
    formattedDate = new Date(dateObj.y, dateObj.m - 1, dateObj.d);
  } else if (rawDate instanceof Date) {
    // Jika sudah dalam format Date
    formattedDate = rawDate;
  } else {
    // Jika berupa string, coba buat objek Date
    formattedDate = new Date(rawDate);
  }

  // Pastikan bahwa tanggal valid, dan konversi ke format 'YYYY-MM-DD'
  if (!isNaN(formattedDate.getTime())) {
    const yyyy = formattedDate.getFullYear();
    const mm = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(formattedDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null; // Jika tanggal invalid, kembalikan null
};

// Fungsi untuk parsing file Excel dan mengimpor data mahasiswa
const parseExcelAndImport = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  // Validasi header kolom
const expectedHeaders = [
  'nim',
  'nama',
  'tanggal_lahir',
  'angkatan',
  'alamat',
  'no_telp',
  'no_telp_ortu',
  'dosen_pa_nip'
];

const actualHeaders = Object.keys(data[0] || {});
const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

if (missingHeaders.length) {
  throw new Error(`Header Excel tidak sesuai. Kolom yang wajib ada: ${missingHeaders.join(', ')}`);
}

  const results = [];

  for (const row of data) {
    const {
      nim, nama, tanggal_lahir, angkatan, alamat,
      no_telp, no_telp_ortu, dosen_pa_nip
    } = row;

    if (!nim || !nama) {
      results.push({ nim, status: 'Gagal', error: 'NIM dan Nama wajib diisi' });
      continue;
    }

    // Konversi tanggal lahir ke format 'YYYY-MM-DD'
    const tanggalLahirFormatted = formatTanggalLahir(tanggal_lahir);

    if (!tanggalLahirFormatted) {
      results.push({ nim, status: 'Gagal', error: `Tanggal lahir tidak valid untuk NIM ${nim}` });
      continue;
    }

    // Cari ID dosen berdasarkan NIP
    const dosen_pa_id = dosen_pa_nip ? await getDosenIdByNip(dosen_pa_nip) : null;

    // Menyusun pesan error jika NIP dosen PA atau TA tidak ditemukan
    let errorMessage = '';

    if (dosen_pa_nip && !dosen_pa_id) {
      errorMessage += `Dosen PA dengan NIP "${dosen_pa_nip}" tidak ditemukan. `;
    }

    // Jika ada error pada NIP, kirimkan pesan error
    if (errorMessage) {
      results.push({ nim, status: 'Gagal', error: errorMessage.trim() });
      continue;
    }

    // Cek apakah mahasiswa sudah ada di database
    const [existing] = await db.promise().query(`SELECT * FROM mahasiswa WHERE nim = ?`, [nim]);

    const values = [
      nim, nama, tanggalLahirFormatted || null, angkatan || null,
      alamat || null, no_telp || null, no_telp_ortu || null, // Tambahkan no_telp_ortu
      dosen_pa_id
    ];

    if (existing.length) {
      // UPDATE jika mahasiswa sudah ada
      await db.promise().query(
        `UPDATE mahasiswa SET nama=?, tanggal_lahir=?, angkatan=?, alamat=?, no_telp=?, no_telp_ortu=?, dosen_pa_id=? WHERE nim=?`,
        [nama, tanggalLahirFormatted || null, angkatan, alamat, no_telp, no_telp_ortu || null, dosen_pa_id, nim]
      );
      results.push({ nim, status: 'Updated' });
    } else {
      // INSERT jika mahasiswa belum ada
      await db.promise().query(
        `INSERT INTO mahasiswa (nim, nama, tanggal_lahir, angkatan, alamat, no_telp, no_telp_ortu, dosen_pa_id) VALUES (?, ?, ?, ?, ?, ?, ?, ? )`,
        values
      );
      results.push({ nim, status: 'Inserted' });
    }
  }

  return results;
};

module.exports = { parseExcelAndImport };
