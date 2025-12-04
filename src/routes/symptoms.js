const express = require('express');
const router = express.Router();
const symptomsController = require('../controller/symptomsController');
const {optionalAuth} = require('../middleware/auth');
// Dự đoán bệnh theo triệu chứng (không cần login)
router.post('/check', optionalAuth, symptomsController.symptomsCheck);

module.exports = router;
