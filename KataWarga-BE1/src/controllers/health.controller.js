const db = require('../config/db');
const { version } = require('../../package.json');

/**
 * GET /api/health
 * Verifies Express server and MySQL database connectivity.
 * Extensible for future checks (e.g., Supabase, Redis, Cron, etc.)
 */
const getHealth = async (req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  try {
    // Verify MySQL database connection
    await db.query('SELECT 1');

    return res.status(200).json({
      status: 'OK',
      message: 'KataWarga API is running.',
      database: 'Connected',
      uptime,
      timestamp,
      version
    });
  } catch (error) {
    console.error('Health check database connection failure:', error);
    
    return res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed.',
      database: 'Disconnected',
      error: error.message,
      timestamp
    });
  }
};

module.exports = {
  getHealth
};
