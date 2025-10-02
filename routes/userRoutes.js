const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, onlySuperAdmin } = require('../middleware/role');


// Login (umum)
router.post('/login', userController.login);

// Super admin list all admin
router.get('/admin', verifyToken, onlySuperAdmin, userController.getAllAdminAndSuperAdmin);

// Super Admin add new admin
router.post('/admin', verifyToken, onlySuperAdmin, userController.createAdmin);

// Super admin update admin
router.put('/admin/:id', verifyToken, onlySuperAdmin, userController.updateAdminById);

// Super admin delete admin
router.delete('/admin/:id', verifyToken, onlySuperAdmin, userController.deleteAdminById);

//super admin update datanya sendiri
router.put('/me/superadmin', verifyToken, onlySuperAdmin, userController.updateOwnSuperAdmin);


// Admin & Super Admin update dosen
router.put('/users/dosen/:dosenId', verifyToken, authorizeRoles('admin', 'super_admin'), userController.updateUserByDosenId);

//Admin update dirinya sendiri 
router.put('/me/admin', verifyToken, authorizeRoles('admin'), userController.updateOwnAdmin);


// Dosen update dirinya sendiri
router.put('/me/dosen', verifyToken, authorizeRoles('dosen'), userController.updateOwnUser);

module.exports = router;
