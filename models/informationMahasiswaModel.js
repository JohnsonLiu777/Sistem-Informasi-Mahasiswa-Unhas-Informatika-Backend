const db = require('../config/db');

// Fungsi untuk mendapatkan mahasiswa bimbingan PA
exports.getMahasiswaBimbinganPA = (dosenId, callback) => {
    const query = 'SELECT id, nama, nim, angkatan FROM mahasiswa WHERE dosen_pa_id = ?';
    db.query(query, [dosenId], callback);
};

// Fungsi untuk mendapatkan mahasiswa bimbingan TA berdasarkan tahap terakhir
exports.getMahasiswaBimbinganTA = (dosenId, callback) => {
    const query = `
       SELECT 
    m.id, 
    m.nama, 
    m.nim, 
    m.angkatan,
    st.tahap, 
    st.judul, 
    st.tanggal, 
    st.dosen_pembimbing_id, 
    st.dosen_penguji_1_id, 
    st.dosen_penguji_2_id
FROM mahasiswa m
JOIN skripsi s ON s.mahasiswa_id = m.id
JOIN skripsi_tahap st ON st.skripsi_id = s.id
WHERE st.dosen_pembimbing_id = ?
AND st.id = (
    SELECT MAX(st2.id)
    FROM skripsi_tahap st2
    WHERE st2.skripsi_id = s.id
);
    `;
    db.query(query, [dosenId], callback);
};

// Fungsi untuk mendapatkan mahasiswa yang akan diuji oleh dosen berdasarkan tahap terakhir, memisahkan Penguji 1 dan Penguji 2
exports.getMahasiswaUjian = (dosenId, callback) => {
    const query = `
      SELECT 
    m.id, 
    m.nama, 
    m.nim, 
    m.angkatan,
    CASE 
        WHEN st.dosen_penguji_1_id = ? THEN 'Penguji 1'
        WHEN st.dosen_penguji_2_id = ? THEN 'Penguji 2'
        ELSE 'Tidak Ditemukan'
    END AS peran_pengujian
FROM mahasiswa m
JOIN skripsi s ON s.mahasiswa_id = m.id
JOIN skripsi_tahap st ON st.skripsi_id = s.id
WHERE (st.dosen_penguji_1_id = ? OR st.dosen_penguji_2_id = ?)
AND st.id = (
    SELECT MAX(st2.id)
    FROM skripsi_tahap st2
    WHERE st2.skripsi_id = s.id
);

    `;
    db.query(query, [dosenId, dosenId, dosenId, dosenId], callback);
};




//Untuk Grafik
// Fungsi untuk mendapatkan jumlah mahasiswa bimbingan PA dari setiap dosen, dengan filter berdasarkan angkatan
exports.getJumlahBimbinganPA = (angkatan, callback) => {
    const query = `
        SELECT 
            d.id AS dosen_id, 
            d.nama AS dosen_nama, 
            d.nip AS dosen_nip, 
            COUNT(m.id) AS jumlah_bimbingan_pa
        FROM dosen d
        LEFT JOIN mahasiswa m ON d.id = m.dosen_pa_id
        WHERE m.angkatan = ? OR m.angkatan IS NULL
        GROUP BY d.id;
    `;
    db.query(query, [angkatan], callback);
};


// Fungsi untuk mendapatkan jumlah mahasiswa bimbingan TA dari setiap dosen, dengan filter berdasarkan angkatan
exports.getJumlahBimbinganTA = (angkatan, callback) => {
    const query = `
        SELECT 
            d.id AS dosen_id, 
            d.nama AS dosen_nama, 
            d.nip AS dosen_nip,
            COUNT(DISTINCT CASE 
                WHEN m.angkatan = ? AND st.id = (
                    SELECT MAX(st2.id) 
                    FROM skripsi_tahap st2 
                    WHERE st2.skripsi_id = st.skripsi_id
                ) THEN st.skripsi_id 
            END) AS jumlah_bimbingan_ta
        FROM dosen d
        LEFT JOIN skripsi_tahap st ON d.id = st.dosen_pembimbing_id
        LEFT JOIN skripsi s ON st.skripsi_id = s.id
        LEFT JOIN mahasiswa m ON s.mahasiswa_id = m.id
        GROUP BY d.id;
    `;
    db.query(query, [angkatan], callback);
};

// Untuk mendapatkan jumlah mahasiswa yang diuji oleh dosen (baik sebagai penguji 1 atau 2)
exports.getJumlahPengujianTA = (angkatan, callback) => {
    const query = `
        WITH tahap_terakhir AS (
            SELECT st.* 
            FROM skripsi_tahap st
            JOIN (
                SELECT skripsi_id, MAX(id) as max_id
                FROM skripsi_tahap
                GROUP BY skripsi_id
            ) latest ON st.skripsi_id = latest.skripsi_id AND st.id = latest.max_id
        )
        
        SELECT 
            d.id AS dosen_id,
            d.nama AS dosen_nama,
            d.nip AS dosen_nip,
            COUNT(DISTINCT CASE 
                WHEN m.angkatan = ? THEN s.mahasiswa_id 
            END) AS jumlah_pengujian_ta
        FROM dosen d
        LEFT JOIN tahap_terakhir st ON (d.id = st.dosen_penguji_1_id OR d.id = st.dosen_penguji_2_id)
        LEFT JOIN skripsi s ON st.skripsi_id = s.id
        LEFT JOIN mahasiswa m ON s.mahasiswa_id = m.id
        GROUP BY d.id;
    `;
    db.query(query, [angkatan], callback);
};