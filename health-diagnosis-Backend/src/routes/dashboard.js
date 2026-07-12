const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
router.get('/daily', dashboardController.getDailyData);
module.exports = router;
