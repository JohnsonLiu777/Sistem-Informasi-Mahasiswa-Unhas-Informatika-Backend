const express = require('express');
const cors = require('cors');
require('dotenv').config(); // load env
require('./config/db'); // koneksi ke database
const mahasiswaRoutes = require('./routes/mahasiswaRoutes');
const dosenRoutes = require('./routes/dosenRoutes'); // Pastikan ini mengarah ke dosenRoutes.js
const matakuliahRoutes = require('./routes/matakuliahRoutes'); // Pastikan ini mengarah ke matakuliahRoutes.js
const kpRoutes = require('./routes/kpRoutes');
const kategoriMatakuliahRoutes = require('./routes/kategoriMatakuliahRoutes');
const magangRoutes = require('./routes/magangRoutes'); // Include the magang routes
const skripsiRoutes = require('./routes/skripsiRoutes');
const informasiMahasiswaRoutes = require('./routes/informationMahasiswaRoutes');
const userRoutes = require('./routes/userRoutes')




const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Test route
app.get('/', (req, res) => {
  res.send('API Sistem Mahasiswa aktif!');
});

app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/kategori-matakuliah', kategoriMatakuliahRoutes);
app.use('/api/matakuliah', matakuliahRoutes);
app.use('/api/kp', kpRoutes);
app.use('/api/magang', magangRoutes); // Mount magang routes
app.use('/api/skripsi',skripsiRoutes) // Mount skripsi routes
app.use('/api/dosen', informasiMahasiswaRoutes); // New route for viewing mahasiswa details by dosen
// Gunakan rute login
app.use('/api', userRoutes);
// Mulai server
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
