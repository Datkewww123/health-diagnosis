const express = require('express');
const router = express.Router();
const newsController = require('../controller/newsController');

router.get('/', newsController.getNews);

// Force refresh tin tức ngay lập tức (không cần cron đợi)
router.post('/refresh', newsController.refreshNews);

module.exports = router;
