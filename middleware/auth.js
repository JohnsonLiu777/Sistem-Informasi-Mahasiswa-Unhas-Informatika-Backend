// auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Middleware untuk memverifikasi token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Ambil header authorization
  if (!authHeader) return res.status(401).json({ message: "Token tidak ditemukan" });

  const token = authHeader.split(' ')[1]; // Format: Bearer <token>
  if (!token) return res.status(401).json({ message: "Token tidak valid" });

  // Verifikasi token dengan JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token tidak sah" });

    req.user = decoded; // Menyimpan data user ke dalam req.user
    next(); // Melanjutkan ke middleware berikutnya
  });
};
