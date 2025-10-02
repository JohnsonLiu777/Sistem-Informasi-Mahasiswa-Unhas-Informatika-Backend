const express = require('express');
const router = express.Router();
const kategoriMatakuliahController = require('../controllers/kategoriMatakuliahController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
// GET semua kategori matakuliah
router.get('/',verifyToken, authorizeRoles('admin','super_admin'),kategoriMatakuliahController.getAllKategoriMatakuliah);

// POST menambahkan kategori matakuliah baru
router.post('/',verifyToken,authorizeRoles('admin','super_admin'), kategoriMatakuliahController.createKategoriMatakuliah);

// PUT mengupdate kategori matakuliah berdasarkan ID
router.put('/:id',verifyToken,authorizeRoles('admin','super_admin'), kategoriMatakuliahController.updateKategoriMatakuliah);

// DELETE menghapus kategori matakuliah berdasarkan ID
router.delete('/:id',verifyToken,authorizeRoles('admin','super_admin'), kategoriMatakuliahController.deleteKategoriMatakuliah);

module.exports = router;
