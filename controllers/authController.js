import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';


// LOGIN - semua role (admin, dosen)
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Kesalahan server", error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({ message: "Password salah" });
    }

    // ✅ Buat token dengan dosen_id jika ada
    const payload = {
      userID: user.id,
      username: user.username,
      akses: user.role
    };

    if (user.role === 'dosen' || user.dosen_id) {
      payload.dosen_id = user.dosen_id;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.json({
      message: "Login berhasil",
      token,
      user: payload
    });
  });
};