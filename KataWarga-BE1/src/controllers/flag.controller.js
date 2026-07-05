const db = require('../config/db');

const flagReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const allowed = ['spam', 'hoax', 'tidak_relevan', 'konten_ofensif', 'lainnya'];
    if (!allowed.includes(reason)) {
      return res.status(400).json({ message: 'Reason tidak valid.' });
    }

    const [report] = await db.query('SELECT id, title FROM public_reports WHERE id = ?', [id]);
    if (report.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const [result] = await db.query(
      `INSERT INTO report_flags (reporter_id, report_id, reason, description)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, id, reason, description || null]
    );

    // Insert notifications for all admins and super admins
    try {
      const [admins] = await db.query("SELECT id FROM users WHERE role IN ('admin', 'super_admin')");
      for (const admin of admins) {
        await db.query(
          'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
          [admin.id, id, `Laporan #${id} ("${report[0].title}") dilaporkan warga karena "${reason}".`]
        );
      }
    } catch (notifErr) {
      console.error('Failed to create flag notifications:', notifErr.message);
    }

    return res.status(201).json({
      message: 'Laporan telah dilaporkan ke moderator.',
      flagId: result.insertId,
    });
  } catch (err) {
    console.error('flagReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getFlags = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [flags] = await db.query(
      `SELECT rf.*, u.name AS reporter_name, pr.title AS report_title
       FROM report_flags rf
       JOIN users u ON rf.reporter_id = u.id
       JOIN public_reports pr ON rf.report_id = pr.id
       ${status ? 'WHERE rf.status = ?' : ''}
       ORDER BY rf.created_at DESC
       LIMIT ? OFFSET ?`,
      status ? [status, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM report_flags',
    );

    return res.status(200).json({
      data: flags,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getFlags error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const reviewFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;

    // Support both `status` and `action` for flexibility
    // Available actions: dismiss (just dismiss), delete_report (dismiss + delete report)
    const flagStatus = action === 'delete_report' ? 'reviewed' : (action || status);
    const allowed = ['reviewed', 'dismissed'];

    if (!allowed.includes(flagStatus)) {
      return res.status(400).json({ message: 'Status/action tidak valid.' });
    }

    // Get the flag to find the report_id
    const [flagRows] = await db.query(
      'SELECT report_id FROM report_flags WHERE id = ?',
      [id]
    );
    if (flagRows.length === 0) return res.status(404).json({ message: 'Flag tidak ditemukan.' });

    await db.query(
      'UPDATE report_flags SET status = ? WHERE id = ?',
      [flagStatus, id]
    );

    if (action === 'delete_report') {
      const repId = flagRows[0].report_id;
      const [repOwner] = await db.query('SELECT user_id, status FROM public_reports WHERE id = ?', [repId]);
      if (repOwner.length > 0 && repOwner[0].status !== 'draft') {
        await db.query(
          'UPDATE user_profiles SET reports_count = GREATEST(0, reports_count - 1) WHERE user_id = ?',
          [repOwner[0].user_id]
        );
      }

      await db.query('DELETE FROM report_flags WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM comments WHERE public_report_id = ?', [repId]);
      await db.query('DELETE FROM report_status_logs WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM report_hashtags WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM report_bookmarks WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM report_likes WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM notifications WHERE report_id = ?', [repId]);
      await db.query('DELETE FROM public_reports WHERE id = ?', [repId]);
      return res.status(200).json({ message: 'Flag di-update. Laporan dihapus.' });
    }

    return res.status(200).json({ message: 'Flag di-dismiss.' });
  } catch (err) {
    console.error('reviewFlag error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { flagReport, getFlags, reviewFlag };
