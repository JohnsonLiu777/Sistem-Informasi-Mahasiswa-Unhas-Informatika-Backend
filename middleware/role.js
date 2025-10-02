// role.js
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.akses;

    // Jika role termasuk yang diizinkan
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ message: "Akses ditolak" });
  };
};

// Tambahan khusus untuk super admin
exports.onlySuperAdmin = (req, res, next) => {
  if (req.user.akses !== 'super_admin') {
    return res.status(403).json({ message: "Akses hanya untuk super admin" });
  }
  next();
};
