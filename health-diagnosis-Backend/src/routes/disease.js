const express = require('express');
const router = express.Router();
const diseaseController = require('../controller/diseasesController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Lấy danh sách bệnh lý để gợi ý tìm kiếm (autocomplete)
router.get('/suggestions', diseaseController.listDiseases);

// Tìm kiếm bệnh lý (tiếng Việt)
router.post('/search', optionalAuth, diseaseController.searchDisease);

// Lấy chi tiết bệnh lý (kèm danh sách triệu chứng liên kết)
router.get('/detail/:id', optionalAuth, diseaseController.getDetailed);

// Lấy chi tiết triệu chứng (kèm danh sách các bệnh có triệu chứng này)
router.get('/symptom/:id', verifyToken, diseaseController.getSymptomDetailed);

// Xem lịch sử tìm kiếm bệnh
router.get('/search/history', verifyToken, diseaseController.getSearchHistory);
router.post('/search/history', verifyToken, diseaseController.saveSearchHistory);

module.exports = router;