const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/users — super_admin only, with role filter & pagination
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];

    if (role) {
      where = 'WHERE role = ?';
      params.push(role);
    }

    const [users] = await db.query(
      `SELECT id, name, email, role, avatar, is_online, last_seen, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );

    return res.status(200).json({
      data: users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar, is_online, last_seen, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });
    return res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/users — buat user/admin baru (super_admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email sudah digunakan.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );

    return res.status(201).json({ message: 'User berhasil dibuat.', userId: result.insertId });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const { id } = req.params;

    const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    let query = 'UPDATE users SET name = ?, email = ?, role = ?';
    let params = [name, email, role];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashed);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    return res.status(200).json({ message: 'User berhasil diperbarui.' });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri.' });
    }

    const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return res.status(200).json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id/profile — authenticated user, get public profile + is_following
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      'SELECT id, name, username, email, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const user = users[0];

    const [profiles] = await db.query(
      'SELECT bio, location, website, followers_count, following_count, reports_count FROM user_profiles WHERE user_id = ?',
      [id]
    );
    const profile = profiles.length > 0 ? profiles[0] : {
      bio: null, location: null, website: null,
      followers_count: 0, following_count: 0, reports_count: 0,
    };

    // Calculate real dynamic counts from SQL
    const [[{ comments_count }]] = await db.query('SELECT COUNT(*) AS comments_count FROM comments WHERE user_id = ?', [id]);
    const [[{ likes_count }]] = await db.query('SELECT COUNT(*) AS likes_count FROM report_likes WHERE user_id = ?', [id]);
    const [[{ resolved_count }]] = await db.query("SELECT COUNT(*) AS resolved_count FROM public_reports WHERE user_id = ? AND status = 'selesai'", [id]);

    profile.comments_count = comments_count || 0;
    profile.likes_count = likes_count || 0;
    profile.resolved_count = resolved_count || 0;

    const [[{ is_following }]] = await db.query(
      'SELECT COUNT(*) as is_following FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, id]
    );

    return res.status(200).json({
      data: { user, profile, is_following: !!is_following },
    });
  } catch (err) {
    console.error('getUserProfile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/users/:id/profile — self only
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ message: 'Hanya bisa mengubah profile sendiri.' });
    }

    const { bio, location, website, name, username } = req.body;

    // Upsert user_profiles
    await db.query(
      `INSERT INTO user_profiles (user_id, bio, location, website)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bio = ?, location = ?, website = ?`,
      [id, bio, location, website, bio, location, website]
    );

    if (name) {
      await db.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    }
    if (username) {
      await db.query('UPDATE users SET username = ? WHERE id = ?', [username, id]);
    }

    return res.status(200).json({ message: 'Profile berhasil diperbarui.' });
  } catch (err) {
    console.error('updateUserProfile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/nearby?city={city} — get users filtered by city area
const getNearbyUsers = async (req, res) => {
  try {
    const { city, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = `u.role = 'user' AND u.id != ?`;
    let params = [userId];

    if (city && city.trim()) {
      whereClause += ` AND p.location LIKE ?`;
      params.push(`%${city.trim()}%`);
    }

    const [users] = await db.query(
      `SELECT 
         u.id, u.name, u.avatar,
         COALESCE(p.location, '') AS location,
         COALESCE(p.bio, '') AS bio,
         COALESCE(p.reports_count, 0) AS reports_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following,
         (SELECT COUNT(*) FROM public_reports WHERE user_id = u.id) AS report_count
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY report_count DESC
       LIMIT ? OFFSET ?`,
      [userId, ...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE ${whereClause}`,
      params
    );

    const usersWithMeta = users.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      location: u.location,
      bio: u.bio,
      reports_count: parseInt(u.report_count) || 0,
      is_following: !!u.is_following,
      initials: u.name ? u.name.substring(0, 2).toUpperCase() : '??',
    }));

    return res.status(200).json({
      data: usersWithMeta,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getNearbyUsers error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id/comments — get all comments written by a user
const getUserComments = async (req, res) => {
  try {
    const { id } = req.params;
    const [comments] = await db.query(
      `SELECT c.*, pr.title AS report_title, pr.id AS report_id
       FROM comments c
       JOIN public_reports pr ON c.public_report_id = pr.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );
    return res.status(200).json({ data: comments });
  } catch (err) {
    console.error('getUserComments error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/users/:id/avatar — upload avatar to Supabase
const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ message: 'Hanya bisa mengubah avatar sendiri.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File avatar wajib diisi.' });
    }

    const { uploadToSupabase } = require('../middlewares/upload.middleware');
    const avatarUrl = await uploadToSupabase(req.file, 'avatars');

    if (!avatarUrl) {
      return res.status(500).json({ message: 'Gagal mengupload avatar.' });
    }

    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, id]);

    return res.status(200).json({ message: 'Avatar berhasil diperbarui.', avatar: avatarUrl });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserProfile, updateUserProfile, getNearbyUsers, getUserComments, uploadAvatar };
