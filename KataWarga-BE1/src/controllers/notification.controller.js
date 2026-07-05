const db = require('../config/db');

// GET /api/notifications — notifikasi milik user yang login
const getMyNotifications = async (req, res) => {
  try {
    const { is_read, limit = 50 } = req.query;

    let where = 'WHERE n.user_id = ?';
    let params = [req.user.id];

    if (is_read === '0' || is_read === '1') {
      where += ' AND n.is_read = ?';
      params.push(parseInt(is_read));
    }

    const [rows] = await db.query(
      `SELECT n.*, pr.title AS report_title
       FROM notifications n
       LEFT JOIN public_reports pr ON n.report_id = pr.id
       ${where}
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );
    return res.status(200).json({ data: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.status(200).json({ message: 'Notifikasi ditandai telah dibaca.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.status(200).json({ message: 'Semua notifikasi ditandai telah dibaca.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllRead };
