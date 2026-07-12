const express = require('express');
const router = express.Router();
const newsController = require('../controller/newsController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

router.get('/', newsController.getNews);

// Force refresh tin tức ngay lập tức (không cần cron đợi)
router.post('/refresh', verifyToken, isAdmin, newsController.refreshNews);

module.exports = router;
