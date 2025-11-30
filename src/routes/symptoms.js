const express = require('express'); 
const router = express.Router();

const symptomsController = require('../controller/symptomsController');

router.post('/check', symptomsController.symptomsCheck);
module.exports = router;
