const express = require('express');
const router = express.Router();
const skripsiController = require('../controllers/skripsiController');

//TAHAP PROPOSAL

// Tambah seminar proposal
router.post('/:mahasiswa_id/proposal', skripsiController.addProposal);

// Get seminar proposal
router.get('/:mahasiswa_id/proposal', skripsiController.getProposal);

// Update seminar proposal
router.put('/:mahasiswa_id/proposal', skripsiController.updateProposal);

// Delete seminar proposal
router.delete('/:mahasiswa_id/proposal', skripsiController.deleteProposal);




//Tahap Seminar Hasil
router.post('/:mahasiswa_id/hasil', skripsiController.addHasil);
router.get('/:mahasiswa_id/hasil', skripsiController.getHasil);
router.put('/:mahasiswa_id/hasil', skripsiController.updateHasil);
router.delete('/:mahasiswa_id/hasil', skripsiController.deleteHasil);


// Seminar Tutup
// Tahap Seminar Tutup
router.post('/:mahasiswa_id/tutup', skripsiController.addTutup);
router.get('/:mahasiswa_id/tutup', skripsiController.getTutup);
router.put('/:mahasiswa_id/tutup', skripsiController.updateTutup);
router.delete('/:mahasiswa_id/tutup', skripsiController.deleteTutup);


module.exports = router;
