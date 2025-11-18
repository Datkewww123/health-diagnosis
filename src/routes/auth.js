const express = require('express'); // su dung thu vien express
const router = express.Router(); // tao 1 router rieng 
const auth = require('../controller/authController'); //import authController

router.post('/signup', auth.signup);
router.post('/login', auth.login);

module.exports = router; //xuat router ra ngoai de file khac su dung
