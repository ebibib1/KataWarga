const cron = require('node-cron');
const db = require('../config/db');

const startJobs = () => {
  // Setiap 2 menit: assign laporan yang belum ada adminnya ke admin online
  cron.schedule('*/2 * * * *', async () => {
    try {
      const [unassigned] = await db.query(
        `SELECT id, title, user_id FROM public_reports 
         WHERE assigned_admin_id IS NULL AND status = 'menunggu'`
      );
      if (unassigned.length === 0) return;

      const [admins] = await db.query(
        `SELECT id FROM users WHERE role IN ('admin','super_admin') AND is_online = 1 
         ORDER BY last_seen DESC LIMIT 1`
      );
      if (admins.length === 0) return;

      const adminId = admins[0].id;

      for (const report of unassigned) {
        await db.query(
          'UPDATE public_reports SET assigned_admin_id = ? WHERE id = ?',
          [adminId, report.id]
        );
        await db.query(
          `INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)`,
          [adminId, report.id, `Laporan baru diteruskan ke kamu: "${report.title}"`]
        );
      }

      console.log(`[CRON] ${unassigned.length} laporan di-assign ke admin ID ${adminId}`);
    } catch (err) {
      console.error('[CRON] Error auto-assign:', err.message);
    }
  });

  // Setiap jam: cek deadline laporan prioritas tinggi yang belum diproses
  cron.schedule('0 * * * *', async () => {
    try {
      const [overdue] = await db.query(
        `SELECT id, title, assigned_admin_id FROM public_reports
         WHERE status = 'menunggu' AND deadline < NOW() AND priority = 'tinggi'`
      );

      for (const report of overdue) {
        if (report.assigned_admin_id) {
          await db.query(
            `INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)`,
            [report.assigned_admin_id, report.id, `⚠️ DEADLINE TERLEWAT: Laporan "${report.title}" prioritas TINGGI belum diproses!`]
          );
        }
      }

      if (overdue.length > 0) {
        console.log(`[CRON] ${overdue.length} laporan prioritas tinggi melewati deadline`);
      }
    } catch (err) {
      console.error('[CRON] Error deadline check:', err.message);
    }
  });

  console.log('✅ Background jobs aktif');
};

module.exports = { startJobs };
