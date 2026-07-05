const db = require('../config/db');

// POST /api/reports/:id/like — Like report
const likeReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [report] = await db.query('SELECT id, user_id FROM public_reports WHERE id = ?', [id]);
    if (report.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM report_likes WHERE user_id = ? AND report_id = ?',
      [req.user.id, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Kamu sudah menyukai laporan ini.' });
    }

    await db.query('INSERT INTO report_likes (user_id, report_id) VALUES (?, ?)', [req.user.id, id]);

    // Update likes_count in public_reports
    await db.query('UPDATE public_reports SET likes_count = likes_count + 1 WHERE id = ?', [id]);

    // Notify report owner (skip if liker is the owner)
    if (report[0].user_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
        [report[0].user_id, id, `${req.user.name || 'Seseorang'} menyukai laporan Anda`]
      );
    }

    const [[{ likes_count }]] = await db.query(
      'SELECT COUNT(*) as likes_count FROM report_likes WHERE report_id = ?',
      [id]
    );

    return res.status(201).json({ message: 'Laporan di-like', likes_count });
  } catch (err) {
    console.error('likeReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/reports/:id/like — Unlike report
const unlikeReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [report] = await db.query('SELECT id FROM public_reports WHERE id = ?', [id]);
    if (report.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM report_likes WHERE user_id = ? AND report_id = ?',
      [req.user.id, id]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: 'Kamu belum menyukai laporan ini.' });
    }

    await db.query('DELETE FROM report_likes WHERE user_id = ? AND report_id = ?', [req.user.id, id]);

    // Update likes_count in public_reports
    await db.query('UPDATE public_reports SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [id]);

    const [[{ likes_count }]] = await db.query(
      'SELECT COUNT(*) as likes_count FROM report_likes WHERE report_id = ?',
      [id]
    );

    return res.status(200).json({ message: 'Like dihapus', likes_count });
  } catch (err) {
    console.error('unlikeReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/comments/:id/like — Like comment
const likeComment = async (req, res) => {
  try {
    const { id } = req.params;

    const [comment] = await db.query('SELECT id FROM comments WHERE id = ?', [id]);
    if (comment.length === 0) return res.status(404).json({ message: 'Komentar tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.user.id, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Kamu sudah menyukai komentar ini.' });
    }

    await db.query('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [req.user.id, id]);

    const [[{ likes_count }]] = await db.query(
      'SELECT COUNT(*) as likes_count FROM comment_likes WHERE comment_id = ?',
      [id]
    );

    return res.status(201).json({ message: 'Komentar di-like', likes_count });
  } catch (err) {
    console.error('likeComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/comments/:id/like — Unlike comment
const unlikeComment = async (req, res) => {
  try {
    const { id } = req.params;

    const [comment] = await db.query('SELECT id FROM comments WHERE id = ?', [id]);
    if (comment.length === 0) return res.status(404).json({ message: 'Komentar tidak ditemukan.' });

    const [existing] = await db.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.user.id, id]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: 'Kamu belum menyukai komentar ini.' });
    }

    await db.query('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [req.user.id, id]);

    const [[{ likes_count }]] = await db.query(
      'SELECT COUNT(*) as likes_count FROM comment_likes WHERE comment_id = ?',
      [id]
    );

    return res.status(200).json({ message: 'Like dihapus', likes_count });
  } catch (err) {
    console.error('unlikeComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { likeReport, unlikeReport, likeComment, unlikeComment };
