const express = require('express');
const router = express.Router();
const diseaseController = require('../controller/diseasesController');
const {verifyToken} = require('../middleware/auth');

router.post('/search', diseaseController.searchDisease);
router.get('/detail/:id', verifyToken, diseaseController.getDetailed);
module.exports = router;