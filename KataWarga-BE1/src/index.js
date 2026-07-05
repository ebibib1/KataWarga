const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware global ─────────────────────────────────────
app.use(cors());

// Conditional JSON parsing - skip untuk FormData
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    // Skip JSON parsing untuk FormData
    next();
  } else {
    // Parse sebagai JSON untuk request lainnya
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Static folder untuk gambar yang di-upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const healthRoutes = require('./routes/health.routes');
console.log('Registering routes...');
const {
  userRouter,
  userSocialRouter,
  categoryRouter,
  notifRouter,
  commentRouter,
  hashtagRouter,
  flagRouter,
  analyticsRouter,
} = require('./routes/other.routes');
const { router: sseRouter } = require('./routes/sse.routes');
const configRoutes = require('./routes/config.routes');

app.use('/api/auth',          authRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/health',        healthRoutes);
app.use('/api/sse',           sseRouter);
app.use('/api/users',         userSocialRouter);  // Public profile & social (authenticated) — MUST be before userRouter
app.use('/api/users',         userRouter);        // Super admin user management
app.use('/api/categories',    categoryRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/comments',      commentRouter);
app.use('/api/hashtags',      hashtagRouter);
app.use('/api/flags',         flagRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/config',        configRoutes);

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ message: 'KataWarga API jalan!', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} tidak ditemukan.` });
});

// Error handler global (termasuk multer error)
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
  }
  res.status(500).json({ message: err.message || 'Server error.' });
});

// ── Background Jobs ───────────────────────────────────────
const { startJobs } = require('./utils/cron');
startJobs();

// ── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 KataWarga API berjalan di http://localhost:${PORT}`);
});

