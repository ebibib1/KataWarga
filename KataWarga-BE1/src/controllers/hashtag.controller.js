const db = require('../config/db');

// Get trending hashtags
const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 20, period = 'week' } = req.query;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND rh.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } else if (period === 'month') {
      dateFilter = 'AND rh.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }
    // period = 'all' → no date filter

    const [rows] = await db.query(
      `SELECT h.id, h.name, h.usage_count, h.created_at,
              (SELECT COUNT(*) FROM report_hashtags rh WHERE rh.hashtag_id = h.id ${dateFilter}) as usage_count_period
       FROM hashtags h
       ORDER BY usage_count_period DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error('getTrendingHashtags error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get reports by hashtag
const getReportsByHashtag = async (req, res) => {
  try {
    const { name: hashtag } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [hashtagRows] = await db.query('SELECT id FROM hashtags WHERE name = ?', [hashtag]);
    if (hashtagRows.length === 0) return res.status(404).json({ message: 'Hashtag tidak ditemukan.' });

    const hashtagId = hashtagRows[0].id;

    const [reports] = await db.query(
      `SELECT pr.*,
              u.name AS user_name, u.avatar AS user_avatar,
              c.category_name,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id) as comments_count
       FROM public_reports pr
       JOIN report_hashtags rh ON pr.id = rh.report_id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN categories c ON pr.category_id = c.id
       WHERE rh.hashtag_id = ?
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [hashtagId, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM report_hashtags WHERE hashtag_id = ?`,
      [hashtagId]
    );

    return res.status(200).json({
      data: reports,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getReportsByHashtag error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getTrendingHashtags, getReportsByHashtag };
