const express = require('express');
const router = express.Router();
const informationMahasiswaController = require('../controllers/informationMahasiswaController');

// Route untuk mendapatkan mahasiswa bimbingan PA
router.get('/:dosenId/mahasiswa/bimbingan-pa', informationMahasiswaController.getMahasiswaBimbinganPA);

// Route untuk mendapatkan mahasiswa bimbingan TA
router.get('/:dosenId/mahasiswa/bimbingan-ta', informationMahasiswaController.getMahasiswaBimbinganTA);

// Route untuk mendapatkan mahasiswa yang akan diuji
router.get('/:dosenId/mahasiswa/ujian', informationMahasiswaController.getMahasiswaUjian);


// Untuk grafik
// Route untuk mendapatkan jumlah mahasiswa bimbingan PA berdasarkan angkatan
router.get('/bimbingan-pa', informationMahasiswaController.getJumlahBimbinganPA);

// Route untuk mendapatkan jumlah mahasiswa bimbingan TA berdasarkan angkatan
router.get('/bimbingan-ta', informationMahasiswaController.getJumlahBimbinganTA);

// Route untuk mendapatkan jumlah mahasiswa yang diuji oleh dosen
router.get('/pengujian-ta', informationMahasiswaController.getJumlahPengujianTA);

module.exports = router;
