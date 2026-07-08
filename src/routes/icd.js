const express = require('express');
const router = express.Router();
const icdController = require('../controller/icdController');
const { verifyToken } = require('../middleware/auth');

// Tìm kiếm bệnh từ WHO ICD-11
// GET /api/icd/search?q=influenza
router.get('/search', verifyToken, icdController.search);

// Chi tiết bệnh từ WHO ICD-11 + Wikipedia
// GET /api/icd/detail/1235618695
router.get('/detail/:icdId', verifyToken, icdController.detail);

// Làm giàu thông tin bệnh từ Wikipedia (dùng với DB nội bộ)
// GET /api/icd/enrich/Bệnh%20cúm
router.get('/enrich/:diseaseName', verifyToken, icdController.enrich);

module.exports = router;
