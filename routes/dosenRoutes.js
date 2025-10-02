// routes/dosenRoutes.js
const express = require('express');
const router = express.Router();
const dosenController = require('../controllers/dosenController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// GET semua dosen
router.get('/', verifyToken, authorizeRoles('admin','super_admin'),dosenController.getAllDosen);


// POST tambah dosen baru
router.post('/',verifyToken, authorizeRoles('admin','super_admin'),dosenController.createDosen);

// PUT update dosen by id
router.put('/:id',verifyToken, authorizeRoles('admin','super_admin'), dosenController.updateDosen);

// DELETE dosen by id
router.delete('/:id',verifyToken, authorizeRoles('admin','super_admin'), dosenController.deleteDosen);

// Detail Dosen
router.get(
  '/:id/detail',
  dosenController.getDosenDetailFull
);

// Statistik dosen per angkatan (untuk grafik)
router.get(
  '/statistik',
  dosenController.getStatistikDosen
);


//Dashboard Dosen
//Melihat list bimbingan PA Dosen
router.get('/pa/mahasiswa', verifyToken, authorizeRoles('dosen'), dosenController.getMahasiswaPAFull);


//Melihat list bimbingan TA Dosen
// Tambahkan di bawah route PA
router.get('/ta/mahasiswa', verifyToken, authorizeRoles('dosen'), dosenController.getMahasiswaBimbinganTA);

//List Mahasiswa yang diuji
router.get('/pengujian/mahasiswa', verifyToken, authorizeRoles('dosen'), dosenController.getMahasiswaPengujian);


module.exports = router;
