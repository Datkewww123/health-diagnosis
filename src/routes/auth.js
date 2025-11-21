const express = require('express'); // su dung thu vien express
const router = express.Router(); // tao 1 router rieng 
const { verifyToken } = require('../middleware/auth');
const auth = require('../controller/authController'); //import authController

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/forgotpassword', auth.forgotpassword);
router.post('/verifyOtp', auth.verifyOtp);
router.post('/resetpassword', auth.resetPassword);
router.get('/getuser', verifyToken, auth.getuser); // Phải có verifyToken đứng giữa để check xem user đã đăng nhập chưa
module.exports = router; //xuat router ra ngoai de file khac su dung
