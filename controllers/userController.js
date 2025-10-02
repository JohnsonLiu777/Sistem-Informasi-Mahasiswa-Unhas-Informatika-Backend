const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');
dotenv.config();

// ✅ LOGIN
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Kesalahan server", error: err });

    if (results.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({ message: "Password salah" });
    }

    const payload = {
      userID: user.id,
      username: user.username,
      akses: user.role
    };

    if (user.role === 'dosen' || user.dosen_id) {
      payload.dosen_id = user.dosen_id;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: "Login berhasil", token, user: payload });
  });
};


// Tambah Admin Baru (khusus super_admin)
exports.createAdmin = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  // Cek apakah username sudah digunakan
  const checkSql = "SELECT id FROM users WHERE username = ?";
  db.query(checkSql, [username], (errCheck, resultCheck) => {
    if (errCheck) {
      return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
    }

    if (resultCheck.length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });
    }

    // Tambahkan admin baru
    const insertSql = "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')";
    db.query(insertSql, [username, password], (errInsert, resultInsert) => {
      if (errInsert) {
        return res.status(500).json({ message: "Gagal menambahkan admin", error: errInsert });
      }

      res.status(201).json({ message: "Admin baru berhasil ditambahkan", adminId: resultInsert.insertId });
    });
  });
};


// ✅ SUPER ADMIN: Update Admin by userID
exports.updateAdminById = (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const checkAdminSql = "SELECT * FROM users WHERE id = ? AND role = 'admin'";
  db.query(checkAdminSql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Gagal mencari admin", error: err });
    if (result.length === 0) return res.status(404).json({ message: "Admin tidak ditemukan" });

    const checkUsernameSql = "SELECT id FROM users WHERE username = ? AND id != ?";
    db.query(checkUsernameSql, [username, id], (errCheck, resultCheck) => {
      if (errCheck) return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
      if (resultCheck.length > 0) return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });

      const updateSql = "UPDATE users SET username = ?, password = ? WHERE id = ?";
      db.query(updateSql, [username, password, id], (err2) => {
        if (err2) return res.status(500).json({ message: "Gagal mengupdate admin", error: err2 });
        res.json({ message: "Admin berhasil diperbarui", id });
      });
    });
  });
};

// Hapus Admin berdasarkan ID (khusus super_admin)
exports.deleteAdminById = (req, res) => {
  const { id } = req.params;

  // Cegah super_admin menghapus dirinya sendiri
  if (req.user.userID == id) {
    return res.status(403).json({ message: "Anda tidak bisa menghapus akun Anda sendiri" });
  }

  // Pastikan target benar-benar admin
  const checkSql = "SELECT * FROM users WHERE id = ? AND role = 'admin'";
  db.query(checkSql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Kesalahan saat mencari admin", error: err });
    if (result.length === 0) return res.status(404).json({ message: "Admin tidak ditemukan atau bukan admin" });

    const deleteSql = "DELETE FROM users WHERE id = ?";
    db.query(deleteSql, [id], (errDel) => {
      if (errDel) return res.status(500).json({ message: "Gagal menghapus admin", error: errDel });
      res.json({ message: "Admin berhasil dihapus", adminId: id });
    });
  });
};

// ✅ ADMIN / SUPER ADMIN: Update Dosen by dosen_id
exports.updateUserByDosenId = (req, res) => {
  const { dosenId } = req.params;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const checkDosenSql = "SELECT * FROM users WHERE dosen_id = ?";
  db.query(checkDosenSql, [dosenId], (err, result) => {
    if (err) return res.status(500).json({ message: "Gagal mencari dosen", error: err });
    if (result.length === 0) return res.status(404).json({ message: "Dosen tidak ditemukan" });

    const checkUsernameSql = "SELECT id FROM users WHERE username = ? AND dosen_id != ?";
    db.query(checkUsernameSql, [username, dosenId], (errCheck, resultCheck) => {
      if (errCheck) return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
      if (resultCheck.length > 0) return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });

      const updateSql = "UPDATE users SET username = ?, password = ? WHERE dosen_id = ?";
      db.query(updateSql, [username, password, dosenId], (err2) => {
        if (err2) return res.status(500).json({ message: "Gagal mengupdate user dosen", error: err2 });
        res.json({ message: "Akun dosen berhasil diperbarui", dosen_id: dosenId });
      });
    });
  });
};

// Lihat semua admin & super_admin (khusus super_admin)
exports.getAllAdminAndSuperAdmin = (req, res) => {
  const sql = "SELECT id, username, password, role FROM users WHERE role IN ('admin', 'super_admin') ORDER BY role ASC, id ASC";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengambil data", error: err });
    }

    res.json({
      message: "Daftar admin dan super admin berhasil diambil",
      total: results.length,
      data: results
    });
  });
};

// SUPER ADMIN: Update akun dirinya sendiri
exports.updateOwnSuperAdmin = (req, res) => {
  const { username, password } = req.body;
  const userId = req.user.userID;

  // Pastikan user yang login benar-benar super_admin
  if (req.user.akses !== 'super_admin') {
    return res.status(403).json({ message: "Akses hanya untuk super admin" });
  }

  // Validasi input
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  // Cek apakah username sudah digunakan oleh user lain
  const checkSql = "SELECT id FROM users WHERE username = ? AND id != ?";
  db.query(checkSql, [username, userId], (errCheck, resultCheck) => {
    if (errCheck) {
      return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
    }

    if (resultCheck.length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });
    }

    // Update akun super admin
    const updateSql = "UPDATE users SET username = ?, password = ? WHERE id = ? AND role = 'super_admin'";
    db.query(updateSql, [username, password, userId], (errUpdate) => {
      if (errUpdate) {
        return res.status(500).json({ message: "Gagal memperbarui akun super admin", error: errUpdate });
      }

      res.json({ message: "Akun super admin berhasil diperbarui", userID: userId });
    });
  });
};



// ✅ ADMINUpdate username dosen dan password sendiri
// ADMIN: Update akun dirinya sendiri
exports.updateOwnAdmin = (req, res) => {
  const { username, password } = req.body;
  const userId = req.user.userID;

  // Pastikan role yang login adalah admin
  if (req.user.akses !== 'admin') {
    return res.status(403).json({ message: "Akses hanya untuk admin" });
  }

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  // Cek apakah username sudah dipakai user lain
  const checkSql = "SELECT id FROM users WHERE username = ? AND id != ?";
  db.query(checkSql, [username, userId], (errCheck, resultCheck) => {
    if (errCheck) {
      return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
    }

    if (resultCheck.length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });
    }

    const updateSql = "UPDATE users SET username = ?, password = ? WHERE id = ? AND role = 'admin'";
    db.query(updateSql, [username, password, userId], (errUpdate) => {
      if (errUpdate) {
        return res.status(500).json({ message: "Gagal memperbarui akun admin", error: errUpdate });
      }

      res.json({ message: "Akun admin berhasil diperbarui", userID: userId });
    });
  });
};




// ✅ DOSEN: Update Username dosen dan Password Sendiri
exports.updateOwnUser = (req, res) => {
  const { username, password } = req.body;
  const dosenId = req.user.dosen_id;

  if (!dosenId) return res.status(403).json({ message: "Akses hanya untuk dosen" });
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const checkUsernameSql = "SELECT id FROM users WHERE username = ? AND dosen_id != ?";
  db.query(checkUsernameSql, [username, dosenId], (errCheck, resultCheck) => {
    if (errCheck) return res.status(500).json({ message: "Kesalahan validasi username", error: errCheck });
    if (resultCheck.length > 0) return res.status(400).json({ message: "Username sudah digunakan oleh user lain" });

    const updateSql = "UPDATE users SET username = ?, password = ? WHERE dosen_id = ?";
    db.query(updateSql, [username, password, dosenId], (err2) => {
      if (err2) return res.status(500).json({ message: "Gagal memperbarui akun", error: err2 });
      res.json({ message: "Akun Anda berhasil diperbarui", dosen_id: dosenId });
    });
  });
};
