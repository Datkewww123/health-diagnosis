const express = require('express');
const userController = require('../controller/userController');
const router = express.Router();

const {verifyToken} = require('../middleware/auth');

// lay thong tin cua user
router.get('/user', verifyToken, userController.getUser);

// update user
router.put('/updateUser', verifyToken, userController.updateUser);

module.exports = router;