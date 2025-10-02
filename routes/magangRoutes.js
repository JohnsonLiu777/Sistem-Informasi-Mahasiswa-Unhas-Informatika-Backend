    const express = require('express');
    const router = express.Router();
    const magangController = require('../controllers/magangController');
    const { verifyToken } = require('../middleware/auth');  // Middleware untuk verifikasi token
    const { authorizeRoles } = require('../middleware/role');

    // Route untuk menambahkan magang dan matakuliah yang dikonversi
    router.post('/:mahasiswa_id',verifyToken,authorizeRoles('admin','super_admin'), magangController.addMagang);

    // Update detail magang (data dan matakuliah konversi)
    router.put('/:id',verifyToken,authorizeRoles('admin','super_admin'), magangController.updateMagang);


    // Route untuk melihat detail magang berdasarkan mahasiswa_id
    router.get('/:mahasiswa_id', verifyToken,authorizeRoles('admin','super_admin'),magangController.getDetailMagang);

    // Route untuk menghapus detail magang berdasarkan ID magang
    router.delete('/:id',verifyToken,authorizeRoles('admin','super_admin'), magangController.deleteMagang);
    module.exports = router;
