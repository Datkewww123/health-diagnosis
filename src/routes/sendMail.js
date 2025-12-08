const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const leaveController = require('../controller/mailController');

router.post('/sendemail', verifyToken, leaveController.sendLeaveEmail);

module.exports = router;
