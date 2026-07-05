const router = require('express').Router();
const { getConfig } = require('../controllers/config.controller');
const verifyToken = require('../middlewares/auth.middleware');

// GET /api/config — requires auth (to prevent public scraping)
router.get('/', verifyToken, getConfig);

module.exports = router;
