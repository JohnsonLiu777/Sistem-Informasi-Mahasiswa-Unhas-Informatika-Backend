const multer = require('multer');
const path = require('path');

// Konfigurasi penyimpanan file Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/matakuliah_mahasiswa'); // Folder penyimpanan
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Nama file unik
  },
});

// Filter untuk hanya menerima file Excel
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file Excel yang diperbolehkan!'), false);
  }
};

// Setup multer untuk upload
const upload = multer({ storage, fileFilter });

module.exports = upload;
