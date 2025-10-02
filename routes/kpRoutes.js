// routes/kpRoutes.js
const express = require('express');
const router = express.Router();
const kpController = require('../controllers/kpController');
const { verifyToken } = require('../middleware/auth');  // Middleware untuk verifikasi token
const { authorizeRoles } = require('../middleware/role');

// Route untuk menambahkan data KP
router.post('/:mahasiswa_id',verifyToken,authorizeRoles('admin','super_admin'), kpController.addKP);

// Route untuk melihat detail KP mahasiswa berdasarkan mahasiswa_id
router.get('/:mahasiswa_id',verifyToken,authorizeRoles('admin','super_admin'),kpController.getDetailKP);

// Route untuk mengupdate detail KP mahasiswa berdasarkan mahasiswa_id
router.put('/:mahasiswa_id',verifyToken,authorizeRoles('admin','super_admin'),kpController.updateKP);

// Route untuk menghapus data KP mahasiswa berdasarkan mahasiswa_id
router.delete('/:mahasiswa_id', verifyToken,authorizeRoles('admin','super_admin'),kpController.deleteKP);

module.exports = router;
