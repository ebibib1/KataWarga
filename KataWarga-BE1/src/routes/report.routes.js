const express = require('express');
const router = express.Router();
const {
  getAllReports, getReportById, createReport,
  updateReport, updateStatus, resolveReport, deleteReport,
  getStats, getTrending,
} = require('../controllers/report.controller');
const { toggleBookmark, deleteBookmark, getBookmarks } = require('../controllers/bookmark.controller');
const { addComment } = require('../controllers/comment.controller');
const { likeReport, unlikeReport } = require('../controllers/like.controller');
const { flagReport } = require('../controllers/flag.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRole = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Semua route butuh login
router.use(verifyToken);

router.get('/',           getAllReports);
router.get('/stats',      getStats);
router.get('/trending',   getTrending);
router.get('/bookmarks',  getBookmarks);

// Bookmark
console.log('Registering bookmark routes');
router.post('/:id/bookmark', toggleBookmark);
router.delete('/:id/bookmark', deleteBookmark);

router.get('/:id',        getReportById);
router.post('/',          upload.single('image'), createReport);

// Update draft — pemilik draft
router.put('/:id',        upload.single('image'), updateReport);

// Hanya admin & super_admin yang bisa ubah status (bukan ke 'selesai')
router.patch('/:id/status', authorizeRole('admin', 'super_admin'), updateStatus);

// Hanya user pemilik laporan yang bisa tandai selesai
router.patch('/:id/resolve', authorizeRole('user'), resolveReport);

// Hapus laporan — super_admin semua status, user hanya bisa hapus draft sendiri
router.delete('/:id', deleteReport);

// Komentar (nested di bawah report)
router.post('/:id/comments', addComment);

// Like report
router.post('/:id/like',   likeReport);
router.delete('/:id/like', unlikeReport);

// Flag report
router.post('/:id/flag', flagReport);

module.exports = router;
