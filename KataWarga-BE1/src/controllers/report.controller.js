const db = require('../config/db');
const { sendNotification } = require('../routes/sse.routes');


// Helper: cari admin online
const getAvailableAdmin = async () => {
  const [rows] = await db.query(
    `SELECT id FROM users 
     WHERE role IN ('admin','super_admin') AND is_online = 1 
     ORDER BY last_seen DESC LIMIT 1`
  );
  return rows.length > 0 ? rows[0].id : null;
};

// GET /api/reports — semua laporan (bisa filter by status, priority, category)
const getAllReports = async (req, res) => {
  try {
    const { status, priority, category_id, search, lat, lng, page = 1, limit = 10, mine, user_id, liked, sort } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let whereParams = [];
    let orderBy = 'pr.created_at DESC';

    if (sort === 'populer') {
      orderBy = '(COALESCE(pr.likes_count,0) + COALESCE(pr.comments_count,0) + COALESCE(pr.shares_count,0)) DESC';
    } else if (sort === 'trending') {
      orderBy = '((COALESCE(pr.likes_count,0) + COALESCE(pr.comments_count,0) + COALESCE(pr.shares_count,0)) / (1 + DATEDIFF(NOW(), pr.created_at))) DESC';
    }

    // Draft filtering logic:
    // - If status='draft' requested, only return user's own drafts
    // - If no status filter and not mine=true, exclude drafts from results
    if (status === 'draft') {
      whereConditions.push('pr.status = ?');
      whereParams.push('draft');
      whereConditions.push('pr.user_id = ?');
      whereParams.push(req.user.id);
    } else {
      if (status) { whereConditions.push('pr.status = ?'); whereParams.push(status); }
    }

    if (priority)    { whereConditions.push('pr.priority = ?');     whereParams.push(priority); }
    if (category_id) { whereConditions.push('pr.category_id = ?'); whereParams.push(category_id); }

    // Full-text search + hashtags
    if (search) {
      const searchClean = search.trim().replace(/^#/, '');
      whereConditions.push(`(
        pr.title LIKE ? OR 
        pr.description LIKE ? OR 
        pr.id IN (
          SELECT rh.report_id 
          FROM report_hashtags rh 
          JOIN hashtags h ON rh.hashtag_id = h.id 
          WHERE h.name LIKE ?
        )
      )`);
      whereParams.push(`%${search}%`, `%${search}%`, `%${searchClean}%`);
    }

    // Sorting by distance — keep distanceParams separate so SQL ? positions stay correct
    let distanceSelect = '';
    let distanceParams = [];
    if (lat && lng) {
      distanceSelect = `, (
        6371 * acos(
          cos(radians(?)) * cos(radians(pr.latitude)) * cos(radians(pr.longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(pr.latitude))
        )
      ) AS distance`;
      distanceParams = [parseFloat(lat), parseFloat(lng), parseFloat(lat)];
      orderBy = 'distance ASC';
    }

    // Determine target user — for liked filter or report creator filter
    const reportUserId = liked === 'true' ? null : user_id;

    // Filter by user or mine:
    if (reportUserId) {
      whereConditions.push('pr.user_id = ?');
      whereParams.push(reportUserId);
      if (parseInt(reportUserId) !== req.user.id) {
        whereConditions.push("pr.status != 'draft'");
      }
    } else if (mine === 'true') {
      // Show only this user's own reports (including their drafts)
      whereConditions.push('pr.user_id = ?');
      whereParams.push(req.user.id);
    } else if (liked !== 'true') {
      // Public feed: never show drafts (skip when filtering by liked)
      whereConditions.push("pr.status != 'draft'");
    }

    // Filter by liked:
    if (liked === 'true') {
      const targetLikedUserId = user_id ? parseInt(user_id) : req.user.id;
      whereConditions.push('pr.id IN (SELECT report_id FROM report_likes WHERE user_id = ?)');
      whereParams.push(targetLikedUserId);
      whereConditions.push("pr.status != 'draft'");
    }

    const whereStr = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Correct ? order in SQL:
    // 1. distanceSelect ?s (lat, lng, lat)
    // 2. user_liked subquery ? (req.user.id)
    // 3. WHERE clause ?s
    // 4. LIMIT, OFFSET
    const [reports] = await db.query(
      `SELECT pr.* ${distanceSelect},
              u.name AS user_name, u.username AS user_username, u.avatar AS user_avatar,
              c.category_name,
              a.name AS admin_name,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id) as comments_count,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id AND user_id = ?) as user_liked,
              (SELECT COUNT(*) FROM report_bookmarks WHERE report_id = pr.id AND user_id = ?) as user_bookmarked
       FROM public_reports pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN categories c ON pr.category_id = c.id
       LEFT JOIN users a ON pr.assigned_admin_id = a.id
       ${whereStr}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...distanceParams, req.user.id, req.user.id, ...whereParams, parseInt(limit), parseInt(offset)]
    );

    // Fetch hashtags for each report to avoid being empty/undefined in listing pages
    if (reports.length > 0) {
      const reportIds = reports.map(r => r.id);
      const [hashtagRows] = await db.query(
        `SELECT rh.report_id, h.name
         FROM report_hashtags rh
         JOIN hashtags h ON rh.hashtag_id = h.id
         WHERE rh.report_id IN (${reportIds.join(',')})`
      );
      const hashtagsMap = {};
      hashtagRows.forEach(row => {
        if (!hashtagsMap[row.report_id]) hashtagsMap[row.report_id] = [];
        hashtagsMap[row.report_id].push(row.name);
      });
      reports.forEach(r => {
        r.hashtags = hashtagsMap[r.id] || [];
      });
    } else {
      reports.forEach(r => { r.hashtags = []; });
    }

    // Convert user_liked and user_bookmarked to boolean
    const reportsWithLiked = reports.map(r => ({
      ...r,
      user_liked: !!r.user_liked,
      user_bookmarked: !!r.user_bookmarked,
      hashtags: r.hashtags || []
    }));

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM public_reports pr ${whereStr}`,
      whereParams
    );

    return res.status(200).json({
      data: reportsWithLiked,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAllReports error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/reports/:id
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT pr.*, 
              u.name AS user_name, u.avatar AS user_avatar,
              c.category_name, c.icon AS category_icon,
              a.name AS admin_name,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id) as comments_count,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id AND user_id = ?) as user_liked,
              (SELECT COUNT(*) FROM report_bookmarks WHERE report_id = pr.id AND user_id = ?) as user_bookmarked
       FROM public_reports pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN categories c ON pr.category_id = c.id
       LEFT JOIN users a ON pr.assigned_admin_id = a.id
       WHERE pr.id = ?`,
      [req.user.id, req.user.id, id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    // Ambil hashtags
    const [hashtags] = await db.query(
      `SELECT h.name
       FROM hashtags h
       JOIN report_hashtags rh ON h.id = rh.hashtag_id
       WHERE rh.report_id = ?`,
      [id]
    );

    // Ambil komentar sekaligus
    const [comments] = await db.query(
      `SELECT cm.*, u.name AS user_name, u.avatar, u.role
       FROM comments cm
       LEFT JOIN users u ON cm.user_id = u.id
       WHERE cm.public_report_id = ?
       ORDER BY cm.created_at ASC`,
      [id]
    );

    // Ambil status logs (timeline)
    const [logs] = await db.query(
      `SELECT sl.*, u.name AS changed_by_name
       FROM report_status_logs sl
       LEFT JOIN users u ON sl.changed_by = u.id
       WHERE sl.report_id = ?
       ORDER BY sl.created_at ASC`,
      [id]
    );

    return res.status(200).json({
      data: {
        ...rows[0],
        user_liked: !!rows[0].user_liked,
        user_bookmarked: !!rows[0].user_bookmarked,
        hashtags: hashtags.map(h => `#${h.name}`),
        comments,
        status_logs: logs,
      }
    });
  } catch (err) {
    console.error('getReportById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { title, description, category_id, priority = 'sedang', hashtags: hashtagStr, latitude, longitude, address, status = 'menunggu' } = req.body;

    // Draft: only require title; published: require title + description
    if (status === 'draft') {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Judul wajib diisi untuk draft.' });
      }
    } else {
      if (!title || !description) {
        return res.status(400).json({ message: 'Judul dan deskripsi wajib diisi.' });
      }
    }

    // Simpan filename gambar (bukan buffer)
    let imageFilename = null;
    if (req.file) {
      imageFilename = req.file.filename;
    }

    let adminId = null;
    // Hanya cari admin jika ini publikasi (bukan draft)
    if (status !== 'draft') {
      adminId = await getAvailableAdmin();
    }

    const [result] = await db.query(
      `INSERT INTO public_reports 
         (title, description, image, user_id, category_id, priority, assigned_admin_id, latitude, longitude, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, imageFilename, req.user.id, category_id || null, priority, adminId, latitude || null, longitude || null, address || null, status]
    );

    // Process hashtags (comma-separated string from form-data)
    if (hashtagStr) {
      const hashtagNames = hashtagStr.split(',').map(h => h.trim().toLowerCase().replace(/^#/, '')).filter(h => h.length > 0);

      for (const name of hashtagNames) {
        await db.query(
          `INSERT INTO hashtags (name) VALUES (?)
           ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
          [name]
        );

        const [[{ id }]] = await db.query('SELECT id FROM hashtags WHERE name = ?', [name]);

        await db.query(
          'INSERT INTO report_hashtags (report_id, hashtag_id) VALUES (?, ?)',
          [result.insertId, id]
        );
      }
    }

    // Kirim notifikasi ke admin jika ada yang online (hanya untuk publikasi)
    if (adminId) {
      await db.query(
        `INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)`,
        [adminId, result.insertId, `Laporan baru masuk: "${title}" — Prioritas ${priority}`]
      );
    }

    // Increment cached reports_count (only for published, not drafts)
    if (status !== 'draft') {
      await db.query(
        'UPDATE user_profiles SET reports_count = reports_count + 1 WHERE user_id = ?',
        [req.user.id]
      );
    }

    const responseMessage = status === 'draft'
      ? 'Draft berhasil disimpan.'
      : 'Laporan berhasil dikirim.';

    return res.status(201).json({
      message: responseMessage,
      reportId: result.insertId,
      assigned_to: adminId ? `Admin ID ${adminId}` : status === 'draft' ? null : 'Menunggu admin tersedia',
    });
  } catch (err) {
    console.error('createReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


// PUT /api/reports/:id — update draft
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, priority, hashtags: hashtagStr, latitude, longitude, address, status } = req.body;

    const [rows] = await db.query('SELECT * FROM public_reports WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Hanya pemilik laporan yang bisa mengubah ini.' });
    if (rows[0].status !== 'draft') return res.status(400).json({ message: 'Hanya laporan status draft yang bisa diubah.' });

    const current = rows[0];

    // Validate: if publishing (status becomes menunggu), title + description required
    const targetStatus = status || current.status;
    if (targetStatus === 'menunggu') {
      const t = title !== undefined ? title : current.title;
      const d = description !== undefined ? description : current.description;
      if (!t || !t.trim()) return res.status(400).json({ message: 'Judul wajib diisi.' });
      if (!d || !d.trim()) return res.status(400).json({ message: 'Deskripsi wajib diisi.' });
    }

    // Upload new image if provided
    let imageUrl = current.image;
    if (req.file) {
      try {
        imageUrl = await uploadToSupabase(req.file);
      } catch (uploadErr) {
        console.error('Image upload error:', uploadErr.message);
      }
    }

    const newTitle = title !== undefined ? title.trim() : current.title;
    const newDescription = description !== undefined ? description : current.description;
    const newCategoryId = category_id !== undefined ? category_id : current.category_id;
    const newPriority = priority !== undefined ? priority : current.priority;
    const newAddress = address !== undefined ? address : current.address;
    const newLat = latitude !== undefined ? latitude : current.latitude;
    const newLng = longitude !== undefined ? longitude : current.longitude;
    const newStatus = status || current.status;

    let adminId = current.assigned_admin_id;
    // If publishing draft (draft → menunggu), assign admin
    if (current.status === 'draft' && newStatus === 'menunggu') {
      adminId = await getAvailableAdmin();
    }

    await db.query(
      `UPDATE public_reports SET
        title = ?, description = ?, image = ?, category_id = ?, priority = ?,
        address = ?, latitude = ?, longitude = ?, status = ?, assigned_admin_id = ?
       WHERE id = ?`,
      [newTitle, newDescription, imageUrl, newCategoryId, newPriority, newAddress, newLat, newLng, newStatus, adminId, id]
    );

    // Update hashtags: delete existing, re-insert
    if (hashtagStr !== undefined) {
      await db.query('DELETE FROM report_hashtags WHERE report_id = ?', [id]);
      const hashtagNames = hashtagStr.split(',').map(h => h.trim().toLowerCase().replace(/^#/, '')).filter(h => h.length > 0);
      for (const name of hashtagNames) {
        await db.query('INSERT INTO hashtags (name) VALUES (?) ON DUPLICATE KEY UPDATE usage_count = usage_count + 1', [name]);
        const [[{ hid }]] = await db.query('SELECT id AS hid FROM hashtags WHERE name = ?', [name]);
        await db.query('INSERT INTO report_hashtags (report_id, hashtag_id) VALUES (?, ?)', [id, hid]);
      }
    }

    // If publishing, send SSE notification
    if (current.status === 'draft' && newStatus === 'menunggu' && adminId) {
      await db.query(
        'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
        [adminId, id, `Laporan baru masuk: "${newTitle}" — Prioritas ${newPriority}`]
      );
      sendNotification(adminId, {
        title: 'Laporan Baru',
        message: `Laporan "${newTitle}" telah dipublikasikan dari draft.`,
        reportId: id,
        type: 'new_report'
      });
    }

    return res.status(200).json({ message: 'Draft berhasil diperbarui.' });
  } catch (err) {
    console.error('updateReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/reports/:id/status — hanya admin
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowed = ['menunggu', 'diproses', 'ditolak'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid. Admin hanya bisa set: menunggu, diproses, ditolak.' });
    }

    const [rows] = await db.query('SELECT * FROM public_reports WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    await db.query('UPDATE public_reports SET status = ? WHERE id = ?', [status, id]);

    // Catat log manual (trigger sudah ada, ini optional untuk note)
    if (note) {
      await db.query(
        `INSERT INTO report_status_logs (report_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, req.user.id, rows[0].status, status, note]
      );
    }

    // Notifikasi ke user pelapor
    await db.query(
      `INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)`,
      [rows[0].user_id, id, `Status laporan "${rows[0].title}" diubah menjadi ${status}`]
    );

    // Push real-time notification
    sendNotification(rows[0].user_id, {
      title: 'Status Laporan Diperbarui',
      message: `Status laporan "${rows[0].title}" diubah menjadi ${status}`,
      reportId: id,
      type: 'status_update'
    });

    return res.status(200).json({ message: 'Status berhasil diperbarui.' });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/reports/:id/resolve — hanya user pemilik laporan
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM public_reports WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Hanya pemilik laporan yang bisa menandai selesai.' });
    }

    await db.query(
      `UPDATE public_reports 
       SET status = 'selesai', is_resolved_by_user = 1, resolved_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    return res.status(200).json({ message: 'Laporan ditandai selesai. Terima kasih!' });
  } catch (err) {
    console.error('resolveReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/reports/:id — super_admin semua status, user hanya jika draft
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM public_reports WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const isSuperAdmin = req.user.role === 'super_admin';
    const isOwner = rows[0].user_id === req.user.id;
    const isDraft = rows[0].status === 'draft';

    if (!isSuperAdmin && !(isOwner && isDraft)) {
      return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus laporan ini.' });
    }

    await db.query('DELETE FROM report_flags WHERE report_id = ?', [id]);
    await db.query('DELETE FROM comments WHERE public_report_id = ?', [id]);
    await db.query('DELETE FROM report_status_logs WHERE report_id = ?', [id]);
    await db.query('DELETE FROM report_hashtags WHERE report_id = ?', [id]);
    await db.query('DELETE FROM report_bookmarks WHERE report_id = ?', [id]);
    await db.query('DELETE FROM report_likes WHERE report_id = ?', [id]);
    await db.query('DELETE FROM notifications WHERE report_id = ?', [id]);
    await db.query('DELETE FROM public_reports WHERE id = ?', [id]);

    // Decrement cached reports_count (only if it was a published report, not a draft)
    if (!isDraft) {
      await db.query(
        'UPDATE user_profiles SET reports_count = GREATEST(0, reports_count - 1) WHERE user_id = ?',
        [rows[0].user_id]
      );
    }

    return res.status(200).json({ message: 'Laporan berhasil dihapus.' });
  } catch (err) {
    console.error('deleteReport error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
// GET /api/reports/stats — platform aggregate statistics
const getStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total_reports,
        SUM(status = 'selesai') AS selesai_count,
        SUM(status = 'diproses') AS diproses_count,
        SUM(status = 'menunggu') AS menunggu_count,
        SUM(status = 'ditolak') AS ditolak_count,
        COUNT(DISTINCT user_id) AS active_reporters
      FROM public_reports
      WHERE status != 'draft'
    `);

    const total = parseInt(stats.total_reports) || 0;
    const selesai = parseInt(stats.selesai_count) || 0;
    const resolvedRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    return res.status(200).json({
      data: {
        total_reports: total,
        selesai_count: selesai,
        diproses_count: parseInt(stats.diproses_count) || 0,
        menunggu_count: parseInt(stats.menunggu_count) || 0,
        ditolak_count: parseInt(stats.ditolak_count) || 0,
        active_reporters: parseInt(stats.active_reporters) || 0,
        resolved_rate: resolvedRate,
      }
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/reports/trending — top reports by engagement (last 7 days)
const getTrending = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const [reports] = await db.query(
      `SELECT pr.*,
              u.name AS user_name, u.avatar AS user_avatar,
              c.category_name,
              (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id) AS comments_count,
              (
                (SELECT COUNT(*) FROM report_likes WHERE report_id = pr.id) +
                (SELECT COUNT(*) FROM comments WHERE public_report_id = pr.id)
              ) AS engagement_score
       FROM public_reports pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN categories c ON pr.category_id = c.id
       WHERE pr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND pr.status != 'draft'
       ORDER BY engagement_score DESC, pr.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    return res.status(200).json({ data: reports });
  } catch (err) {
    console.error('getTrending error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllReports, getReportById, createReport, updateReport, updateStatus, resolveReport, deleteReport, getStats, getTrending };
