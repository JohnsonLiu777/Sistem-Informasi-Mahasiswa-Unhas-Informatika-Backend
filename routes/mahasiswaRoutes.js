const express = require('express');
const router = express.Router();
const mahasiswaController = require('../controllers/mahasiswaController');
const upload = require('../middleware/upload');
const { verifyToken } = require('../middleware/auth');  // Middleware untuk verifikasi token
const { authorizeRoles } = require('../middleware/role');

// GET semua mahasiswa
router.get('/',verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.getAllMahasiswa);

// GET detail mahasiswa by id
router.get('/:id',verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.getMahasiswaById);

//Get List Mahasiswa Filtered by Angkatan, status, dan tahapan Skripsi
router.get('/detail/filter',verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.getFilteredMahasiswa);


// POST tambah mahasiswa baru
router.post('/', verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.createMahasiswa);

// PUT update mahasiswa by id
router.put('/:id', verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.updateMahasiswa);

// DELETE mahasiswa by id
router.delete('/:id',verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.deleteMahasiswaById);

// Endpoint: POST /mahasiswa/import-excel
router.post('/import-excel',verifyToken,authorizeRoles('admin','super_admin'), upload.single('file'), mahasiswaController.importMahasiswaExcel);


//Matakuliah Mahasiswa


// Tambah matakuliah yang sudah dilulusi mahasiswa
router.post('/:mahasiswa_id/matakuliah', verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.addMatakuliahToMahasiswa);

// GET daftar matakuliah yang sudah dilulusi oleh mahasiswa
router.get('/:mahasiswa_id/matakuliah',verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.getMatakuliahByMahasiswa);


// DELETE hapus matakuliah yang sudah dilulusi oleh mahasiswa
router.delete('/:mahasiswa_id/matakuliah/:matakuliah_id',verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.removeMatakuliahFromMahasiswa);

// Route untuk mendapatkan mata kuliah yang belum dilulusi oleh mahasiswa
router.get('/:id/matakuliah-belum-dilulusi',verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.getMatakuliahBelumDilulusi);

//Melihat list matakuliah yang belum dilulusi mahasiswa filtered by kategori dan kurikulum
router.get('/:id/matakuliah-belum-dilulusi/filter', verifyToken,authorizeRoles('admin','super_admin'), mahasiswaController.getMatakuliahBelumDilulusiFiltered);



// Endpoint: POST /mahasiswa/import-matakuliah-excel
router.post('/import-matakuliah-excel',verifyToken,authorizeRoles('admin','super_admin'),mahasiswaController.importMatakuliahExcel);



//Backup CSV
router.get('/export/csv', mahasiswaController.exportMahasiswaCSV);

//Delete Mahasiswa Per angkatan
router.delete('/angkatan/:angkatan', mahasiswaController.deleteMahasiswaByAngkatan);
module.exports = router;
