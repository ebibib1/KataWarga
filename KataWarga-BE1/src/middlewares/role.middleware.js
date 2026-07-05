// Contoh pakai: authorizeRole('admin', 'super_admin')
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Akses ditolak. Hanya ${roles.join(' / ')} yang bisa mengakses ini.`,
      });
    }

    next();
  };
};

module.exports = authorizeRole;
