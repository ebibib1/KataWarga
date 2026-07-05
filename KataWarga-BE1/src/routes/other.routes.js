const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserProfile, updateUserProfile, getNearbyUsers, getUserComments, uploadAvatar } = require('../controllers/user.controller');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { getMyNotifications, markAsRead, markAllRead } = require('../controllers/notification.controller');
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/follow.controller');
const { getTrendingHashtags, getReportsByHashtag } = require('../controllers/hashtag.controller');
const { deleteComment } = require('../controllers/comment.controller');
const { likeComment, unlikeComment } = require('../controllers/like.controller');
const { getFlags, reviewFlag } = require('../controllers/flag.controller');
const { getSidebarData } = require('../controllers/analytics.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRole = require('../middlewares/role.middleware');

const upload = require('../middlewares/upload.middleware');

// ── USER MANAGEMENT (super_admin only) ──────────────────
const userRouter = express.Router();
userRouter.use(verifyToken, authorizeRole('super_admin'));
userRouter.get('/',     getAllUsers);
userRouter.get('/:id',  getUserById);
userRouter.post('/',    createUser);
userRouter.put('/:id',  updateUser);
userRouter.delete('/:id', deleteUser);

// ── USER PUBLIC PROFILE & SOCIAL (authenticated) ─────────
const userSocialRouter = express.Router();
userSocialRouter.use(verifyToken);
userSocialRouter.get('/nearby',         getNearbyUsers);   // MUST be before /:id routes
userSocialRouter.get('/:id/profile',    getUserProfile);
userSocialRouter.get('/:id/comments',   getUserComments);
userSocialRouter.put('/:id/profile',    updateUserProfile);
userSocialRouter.put('/:id/avatar',     upload.single('avatar'), uploadAvatar);
userSocialRouter.post('/:id/follow',    followUser);
userSocialRouter.delete('/:id/follow',  unfollowUser);
userSocialRouter.get('/:id/followers',  getFollowers);
userSocialRouter.get('/:id/following',  getFollowing);


// ── CATEGORIES ───────────────────────────────────────────
const categoryRouter = express.Router();
categoryRouter.get('/', getAllCategories);
categoryRouter.post('/', verifyToken, authorizeRole('admin', 'super_admin'), createCategory);
categoryRouter.put('/:id', verifyToken, authorizeRole('admin', 'super_admin'), updateCategory);
categoryRouter.delete('/:id', verifyToken, authorizeRole('super_admin'), deleteCategory);

// ── NOTIFICATIONS ─────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.use(verifyToken);
notifRouter.get('/',              getMyNotifications);
notifRouter.patch('/:id/read',    markAsRead);
notifRouter.patch('/read-all',    markAllRead);

// ── COMMENTS (standalone) ─────────────────────────────────
const commentRouter = express.Router();
commentRouter.use(verifyToken);
commentRouter.delete('/:id', deleteComment);
commentRouter.post('/:id/like',   likeComment);
commentRouter.delete('/:id/like', unlikeComment);

// ── HASHTAGS ──────────────────────────────────────────────
const hashtagRouter = express.Router();
hashtagRouter.get('/trending', getTrendingHashtags);
hashtagRouter.get('/:name/reports', verifyToken, getReportsByHashtag);

// ── FLAGS — Moderation (admin+) ───────────────────────────
const flagRouter = express.Router();
flagRouter.use(verifyToken, authorizeRole('admin', 'super_admin'));
flagRouter.get('/',       getFlags);
flagRouter.patch('/:id',  reviewFlag);

// ── ANALYTICS ────────────────────────────────────────────
const analyticsRouter = express.Router();
analyticsRouter.use(verifyToken);
analyticsRouter.get('/sidebar', getSidebarData);

module.exports = { userRouter, userSocialRouter, categoryRouter, notifRouter, commentRouter, hashtagRouter, flagRouter, analyticsRouter };
