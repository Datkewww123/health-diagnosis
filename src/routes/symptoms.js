const express = require('express');
const router = express.Router();
const symptomsController = require('../controller/symptomsController');
const {optionalAuth, verifyToken} = require('../middleware/auth');

// Dự đoán bệnh theo triệu chứng (không cần login)
router.get('/', symptomsController.getAllSymptoms);
router.post('/check', optionalAuth, symptomsController.symptomsCheck);
router.get('/history', verifyToken, symptomsController.getHistory);
router.post('/history', verifyToken, symptomsController.savePredictHistory);
module.exports = router;
