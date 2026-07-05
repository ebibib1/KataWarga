const db = require('../config/db');

const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reports] = await db.query(
      `SELECT pr.*,
              u.name AS user_name, u.avatar AS user_avatar,
              c.category_name,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id) as comments_count,
              1 as user_bookmarked
       FROM public_reports pr
       JOIN report_bookmarks rb ON pr.id = rb.report_id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN categories c ON pr.category_id = c.id
       WHERE rb.user_id = ?
       ORDER BY rb.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ data: reports });
  } catch (err) {
    console.error('getBookmarks error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already bookmarked
    const [rows] = await db.query(
      'SELECT id FROM report_bookmarks WHERE report_id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length > 0) {
      // Remove bookmark
      await db.query('DELETE FROM report_bookmarks WHERE report_id = ? AND user_id = ?', [id, userId]);
      return res.status(200).json({ message: 'Bookmark dihapus.' });
    } else {
      // Add bookmark
      await db.query('INSERT INTO report_bookmarks (report_id, user_id) VALUES (?, ?)', [id, userId]);
      return res.status(201).json({ message: 'Laporan disimpan.' });
    }
  } catch (err) {
    console.error('toggleBookmark error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query('DELETE FROM report_bookmarks WHERE report_id = ? AND user_id = ?', [id, userId]);
    return res.status(200).json({ message: 'Bookmark dihapus.' });
  } catch (err) {
    console.error('deleteBookmark error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { toggleBookmark, deleteBookmark, getBookmarks };
