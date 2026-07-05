const db = require('../config/db');

/**
 * GET /api/analytics/sidebar
 * Returns platform stats, trending hashtags, and active users nearby.
 * Query param: ?location=Jakarta Selatan (optional, from current user's profile)
 */
const getSidebarData = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── 1. Platform Stats ─────────────────────────────────────────────────────
    const [[statsRow]] = await db.query(`
      SELECT
        COUNT(*) AS total_reports,
        SUM(status = 'selesai') AS selesai_count,
        SUM(status = 'diproses') AS diproses_count,
        COUNT(DISTINCT category_id) AS categories_active
      FROM public_reports
      WHERE status != 'draft'
    `);

    const total = statsRow.total_reports || 0;
    const selesai = statsRow.selesai_count || 0;
    const resolvedRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    const platformStats = [
      { label: 'Total Laporan',   value: total.toLocaleString('id-ID') },
      { label: 'Selesai',          value: selesai.toLocaleString('id-ID') },
      { label: 'Tingkat Selesai',  value: `${resolvedRate}%` },
      { label: 'Kategori Aktif',   value: String(statsRow.categories_active || 0) },
    ];

    // ── 2. Trending Hashtags (last 7 days) ────────────────────────────────────
    const [hashtagRows] = await db.query(`
      SELECT h.name, h.usage_count AS count
      FROM hashtags h
      JOIN report_hashtags rh ON h.id = rh.hashtag_id
      JOIN public_reports pr ON rh.report_id = pr.id
      WHERE pr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY h.id
      ORDER BY count DESC
      LIMIT 7
    `);

    // Fallback: if no recent hashtags, get all-time top
    let trendingHashtags = hashtagRows;
    if (trendingHashtags.length === 0) {
      const [allTime] = await db.query(
        'SELECT name, usage_count AS count FROM hashtags ORDER BY usage_count DESC LIMIT 7'
      );
      trendingHashtags = allTime;
    }

    // ── 3. Active Users Nearby ────────────────────────────────────────────────
    // Get current user's location first
    const [profileRows] = await db.query(
      'SELECT location FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    const myLocation = profileRows.length > 0 ? (profileRows[0].location || '') : '';

    // Fetch active users — same city area as current user if available
    // Sort by location matching current user's location DESC, then reports count DESC
    let nearbyQuery = `
      SELECT 
        u.id,
        u.name,
        u.avatar,
        COALESCE(p.location, '') AS location,
        COUNT(pr.id) AS reports_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN public_reports pr ON pr.user_id = u.id AND pr.status != 'draft'
      WHERE u.role = 'user' AND u.id != ?
      GROUP BY u.id
      ORDER BY 
        CASE WHEN p.location IS NOT NULL AND p.location != '' AND p.location LIKE ? THEN 1 ELSE 2 END ASC,
        COUNT(pr.id) DESC
      LIMIT 10
    `;

    const locationParam = myLocation ? `%${myLocation.trim()}%` : '%';
    const [nearbyUsers] = await db.query(nearbyQuery, [userId, userId, locationParam]);

    // Group by location area (first word before space or entire string)
    const getArea = (loc) => {
      if (!loc) return 'Area Lain';
      // Match common Jakarta area patterns
      const jakartaAreas = ['Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara', 'Jakarta Pusat'];
      const match = jakartaAreas.find(area => loc.toLowerCase().includes(area.toLowerCase()));
      if (match) return match;
      // Return first two words for other locations
      const parts = loc.trim().split(' ');
      return parts.slice(0, 2).join(' ');
    };

    const usersWithArea = nearbyUsers.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      location: u.location,
      area: getArea(u.location),
      reports: parseInt(u.reports_count) || 0,
      is_following: !!u.is_following,
      initials: u.name ? u.name.substring(0, 2).toUpperCase() : '??',
    }));

    return res.status(200).json({
      platformStats,
      trendingHashtags,
      nearbyUsers: usersWithArea,
    });
  } catch (err) {
    console.error('getSidebarData error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getSidebarData };
