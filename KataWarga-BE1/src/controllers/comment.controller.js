const db = require('../config/db');

// POST /api/reports/:id/comments
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body) return res.status(400).json({ message: 'Komentar tidak boleh kosong.' });

    const [report] = await db.query('SELECT id, user_id, title FROM public_reports WHERE id = ?', [id]);
    if (report.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    const [result] = await db.query(
      `INSERT INTO comments (body, user_id, public_report_id, is_admin_response) VALUES (?, ?, ?, ?)`,
      [body, req.user.id, id, isAdmin ? 1 : 0]
    );

    // Update comments_count in public_reports
    await db.query('UPDATE public_reports SET comments_count = comments_count + 1 WHERE id = ?', [id]);

    // Notify report owner (skip if commenter is the owner)
    if (parseInt(report[0].user_id) !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
        [report[0].user_id, id, `${req.user.name || 'Seseorang'} berkomentar pada laporan "${report[0].title}"`]
      );
    }

    return res.status(201).json({ message: 'Komentar berhasil ditambahkan.', commentId: result.insertId });
  } catch (err) {
    console.error('addComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/comments/:id — admin/super_admin atau pemilik komentar
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Komentar tidak ditemukan.' });

    const isOwner = rows[0].user_id === req.user.id;
    const isAdminRole = ['admin', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdminRole) {
      return res.status(403).json({ message: 'Tidak punya akses untuk menghapus komentar ini.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    
    // Update comments_count in public_reports
    await db.query(
      'UPDATE public_reports SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?',
      [rows[0].public_report_id]
    );
    return res.status(200).json({ message: 'Komentar berhasil dihapus.' });
  } catch (err) {
    console.error('deleteComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { addComment, deleteComment };
