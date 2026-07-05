const db = require('../config/db');

// POST /api/users/:id/follow — Follow user
const followUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa follow diri sendiri.' });
    }

    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (user.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Kamu sudah mengikuti user ini.' });
    }

    await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, id]);
    await db.query('UPDATE user_profiles SET followers_count = followers_count + 1 WHERE user_id = ?', [id]);
    await db.query('UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = ?', [req.user.id]);

    // Notify the followed user
    await db.query(
      'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
      [id, null, `${req.user.name || 'Seseorang'} mulai mengikuti Anda`]
    );

    return res.status(201).json({ message: 'User di-follow', following: true });
  } catch (err) {
    console.error('followUser error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/users/:id/follow — Unfollow user
const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa unfollow diri sendiri.' });
    }

    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (user.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, id]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: 'Kamu belum mengikuti user ini.' });
    }

    await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, id]);
    await db.query('UPDATE user_profiles SET followers_count = followers_count - 1 WHERE user_id = ?', [id]);
    await db.query('UPDATE user_profiles SET following_count = following_count - 1 WHERE user_id = ?', [req.user.id]);

    return res.status(200).json({ message: 'Follow dihapus', following: false });
  } catch (err) {
    console.error('unfollowUser error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id/followers
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.avatar, p.bio, p.location,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
       FROM users u
       JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id IN (
         SELECT follower_id FROM follows WHERE following_id = ?
       )
       ORDER BY u.name ASC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM follows WHERE following_id = ?',
      [id]
    );

    return res.status(200).json({
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getFollowers error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id/following
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.avatar, p.bio, p.location,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
       FROM users u
       JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id IN (
         SELECT following_id FROM follows WHERE follower_id = ?
       )
       ORDER BY u.name ASC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
      [id]
    );

    return res.status(200).json({
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getFollowing error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
