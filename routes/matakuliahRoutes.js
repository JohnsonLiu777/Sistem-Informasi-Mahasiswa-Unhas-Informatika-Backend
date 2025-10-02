// routes/matakuliahRoutes.js
const express = require('express');
const router = express.Router();
const matakuliahController = require('../controllers/matakuliahController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// GET semua matakuliah
router.get('/',verifyToken,authorizeRoles('admin','super_admin'),matakuliahController.getAllMatakuliah);

// Route untuk mengambil detail matakuliah berdasarkan id
router.get('/detail/:id', verifyToken,authorizeRoles('admin','super_admin'),matakuliahController.getMatakuliahDetailById);

// POST tambah matakuliah baru
router.post('/', verifyToken,authorizeRoles('admin','super_admin'),matakuliahController.createMatakuliah);

// PUT update matakuliah by id
router.put('/:id',verifyToken,authorizeRoles('admin','super_admin'), matakuliahController.updateMatakuliah);

// DELETE matakuliah by id
router.delete('/:id',verifyToken,authorizeRoles('admin','super_admin'), matakuliahController.deleteMatakuliah);


// Get matakuliah filter by kategori dan kurkulum
router.get('/filter', verifyToken,authorizeRoles('admin','super_admin'),matakuliahController.getFilteredMatakuliah);

// GET matakuliah berdasarkan tahun kurikulum
router.get('/kurikulum',verifyToken,authorizeRoles('admin','super_admin'), matakuliahController.getMatakuliahByKurikulum);

// Route untuk meng-upload matakuliah via Excel
router.post('/import-excel',verifyToken,authorizeRoles('admin','super_admin'), matakuliahController.importMatakuliahExcel);



module.exports = router;
