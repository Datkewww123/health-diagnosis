const express = require('express'); // su dung thu vien express
const router = express.Router(); // tao 1 router rieng 
const auth = require('../controller/authController'); //import authController

router.post('/signup', auth.signup); // path den signup
router.post('/login', auth.login); //path den login
router.post('/logout', auth.logout);// path de logout
router.post('/forgotpassword', auth.forgotpassword); // khi quen mat khau
router.post('/verifyOtp', auth.verifyOtp); // xac thuc otp
router.post('/resetpassword', auth.resetpassword); // resetpassword
module.exports = router; //xuat router ra ngoai de file khac su dung
