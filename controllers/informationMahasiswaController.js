const InformationMahasiswa = require('../models/informationMahasiswaModel');

// Fungsi untuk mendapatkan mahasiswa bimbingan PA
exports.getMahasiswaBimbinganPA = (req, res) => {
    const dosenId = req.params.dosenId; // Dosen PA ID dari URL
    InformationMahasiswa.getMahasiswaBimbinganPA(dosenId, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: results.length, mahasiswa: results });
    });
};

// Fungsi untuk mendapatkan mahasiswa bimbingan TA berdasarkan tahap terakhir
exports.getMahasiswaBimbinganTA = (req, res) => {
    const dosenId = req.params.dosenId; // Dosen TA ID dari URL
    InformationMahasiswa.getMahasiswaBimbinganTA(dosenId, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Mengirimkan hanya id, nama, nim, angkatan dari mahasiswa
        const simplifiedResults = results.map(student => ({
            id: student.id,
            nama: student.nama,
            nim: student.nim,
            angkatan: student.angkatan
        }));

        res.json({ total: simplifiedResults.length, mahasiswa: simplifiedResults });
    });
};


// Fungsi untuk mendapatkan mahasiswa yang akan diuji oleh dosen, memisahkan Penguji 1 dan Penguji 2
exports.getMahasiswaUjian = (req, res) => {
    const dosenId = req.params.dosenId; // Dosen Penguji ID dari URL
    InformationMahasiswa.getMahasiswaUjian(dosenId, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Pisahkan mahasiswa berdasarkan peran pengujian
        const penguji1 = results.filter(student => student.peran_pengujian === 'Penguji 1');
        const penguji2 = results.filter(student => student.peran_pengujian === 'Penguji 2');

        // Kirimkan dua list terpisah
        res.json({
            total : penguji1.length + penguji2.length,
            total_penguji_1: penguji1.length,
            total_penguji_2: penguji2.length,
            dosen_penguji_1: penguji1,
            dosen_penguji_2: penguji2
        });
    });
};






//Untuk Grafik
// Fungsi untuk mendapatkan jumlah mahasiswa bimbingan PA dari setiap dosen, dengan filter berdasarkan angkatan
exports.getJumlahBimbinganPA = (req, res) => {
    const angkatan = req.query.angkatan; // Mendapatkan tahun angkatan dari query parameter

    InformationMahasiswa.getJumlahBimbinganPA(angkatan, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Jika tidak ada mahasiswa bimbingan untuk dosen, atur jumlah bimbingan PA menjadi 0
        const simplifiedResults = results.map(dosen => ({
            dosen_id: dosen.dosen_id,
            dosen_nama: dosen.dosen_nama,
            dosen_nip: dosen.dosen_nip,
            jumlah_bimbingan_pa: dosen.jumlah_bimbingan_pa || 0 // Set default 0 jika tidak ada mahasiswa
        }));

        res.json(simplifiedResults);
    });
};


// Fungsi untuk mendapatkan jumlah mahasiswa bimbingan TA dari setiap dosen, berdasarkan angkatan
// Ganti fungsi getJumlahBimbinganTA dengan ini:
exports.getJumlahBimbinganTA = (req, res) => {
    InformationMahasiswa.getJumlahBimbinganTA((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Pastikan semua dosen ditampilkan, termasuk yang jumlahnya 0
        const simplifiedResults = results.map(dosen => ({
            dosen_id: dosen.dosen_id,
            dosen_nama: dosen.dosen_nama,
            dosen_nip: dosen.dosen_nip,
            jumlah_bimbingan_ta: dosen.jumlah_bimbingan_ta || 0
        }));

        res.json(simplifiedResults);
    });
};

// Untuk mendapatkan jumlah mahasiswa yang diuji oleh dosen
exports.getJumlahPengujianTA = (req, res) => {
    const angkatan = req.query.angkatan;
    
    if (!angkatan) {
        return res.status(400).json({ 
            error: "Parameter angkatan diperlukan (contoh: ?angkatan=2023)" 
        });
    }

    InformationMahasiswa.getJumlahPengujianTA(angkatan, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ 
                error: "Gagal mengambil data pengujian",
                details: err.message 
            });
        }

        const response = results.map(dosen => ({
            dosen_id: dosen.dosen_id,
            dosen_nama: dosen.dosen_nama,
            dosen_nip: dosen.dosen_nip,
            jumlah_pengujian_ta: dosen.jumlah_pengujian_ta || 0  // Default 0 jika NULL
        }));

        res.json(response);
    });
};