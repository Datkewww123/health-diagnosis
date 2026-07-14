const express = require('express'); // su dung thu vien express
const router = express.Router(); // tao 1 router rieng 
const auth = require('../controller/authController'); //import authController

const validateBody = (requiredFields) => (req, res, next) => {
  const missing = requiredFields.filter(field => !req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim()));
  if (missing.length > 0) {
    return res.status(400).json({ message: `Thiếu trường bắt buộc: ${missing.join(', ')}` });
  }
  next();
};

router.post('/signup', validateBody(['email', 'password', 'Username', 'First_name', 'Last_name']), auth.signup); // path den signup
router.post('/login', validateBody(['Username', 'password']), auth.login); //path den login (Username co the la username hoac email)
router.post('/logout', auth.logout);// path de logout
router.post('/forgotpassword', auth.forgotpassword); // khi quen mat khau
router.post('/verifyOtp', auth.verifyOtp); // xac thuc otp
router.post('/resetpassword', auth.resetpassword); // resetpassword
router.post('/google-login', auth.googleLogin);
module.exports = router; //xuat router ra ngoai de file khac su dung
