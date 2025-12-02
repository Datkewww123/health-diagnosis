require('dotenv').config(); 
const mongoose = require('mongoose'); 
const User = require('../model/user'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); // tao token sau khi login
const nodemailer = require('nodemailer'); // lay thu vien
const OtpCode = require('../model/otpcode');

// Cấu hình email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_APP_PASSWORD // App Password 16 ký tự
  }
});

class AuthController {
  
  // Signup
  async signup(req, res) {
    try {
      const { First_name, Last_name, Username, phone, email, password } = req.body;
      const existEmail = await User.findOne({ email });
      if (existEmail) {
        return res.json({ ok: false, message: "Email is already in used" });
      }
      const userName = await User.findOne({ Username });
      if (userName) {
        return res.json({ ok: false, message: "User name is already taken" });
      }
      const hash = await bcrypt.hash(password, 10);
      await User.create({
        First_name,
        Last_name,
        Username,
        phone,
        email,
        password: hash,
      });
      return res.json({ ok: true, message: "Sign Up successfull!" });
    } catch (err) {
      return res.json({ ok: false, message: "Server Error!", error: err });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { Username, password } = req.body;
      const user = await User.findOne({ Username });
      if (!user) {
        return res.json({ message: "User name not found!" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.json({ message: "Incorrect password!" });
      }
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        "SECRET KEY", // Nên đưa vào .env
        { expiresIn: "1d" }
      );
      return res.json({ token });
    } catch (err) {
      return res.json({ message: "Server Error", Error: err });
    }
  }

  // Logout
  async logout(req, res) {
    res.status(200).json({ message: 'Logout successful!' });
  };

 async forgotpassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email không tìm thấy!' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OtpCode.deleteOne({ userId: user._id });

    await OtpCode.create({
      userId: user._id,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    res.status(200).json({ message: 'OTP đã được gửi thành công. Vui lòng kiểm tra email của bạn!' });

    transporter.sendMail({
      from: `"Health Care Support" <${process.env.MY_EMAIL}>`,
      to: email,
      subject: 'Mã OTP để đặt lại mật khẩu',
      text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`
    }).catch(err => console.error('SendMail error:', err));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
}

  async verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User không tồn tại!" });

    const otpRecord = await OtpCode.findOne({ userId: user._id });
    if (!otpRecord) return res.status(400).json({ message: "OTP không tồn tại! Vui lòng yêu cầu mã mới." });

    if (otpRecord.expiresAt < Date.now()) return res.status(400).json({ message: "OTP đã hết hạn!" });

    const match = await bcrypt.compare(otp, otpRecord.otp);
    if (!match) return res.status(400).json({ message: "OTP không chính xác!" });

    res.json({ message: "Xác thực OTP thành công, bạn có thể đặt lại mật khẩu ngay bây giờ." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

  async resetpassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User không tồn tại!' });

    const otpRecord = await OtpCode.findOne({ userId: user._id });
    if (!otpRecord) return res.status(400).json({ message: "OTP không tồn tại! Vui lòng yêu cầu mã mới." });

    if (otpRecord.expiresAt < Date.now()) return res.status(400).json({ message: "OTP đã hết hạn!" });

    const match = await bcrypt.compare(otp, otpRecord.otp);
    if (!match) return res.status(400).json({ message: "OTP không chính xác!" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    await OtpCode.findByIdAndDelete(otpRecord._id);

    res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

  // Get User
  async getuser(req, res) {
    try {
      // Lưu ý: req.user chỉ có nếu bạn đã dùng middleware xác thực token ở route
      const user = await User.findById(req.user.userId).select('-password -otp -otpExpires');
      if (!user) {
        return res.status(404).json({ message: 'User không tồn tại!' });
      }
      res.json(user);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
}

module.exports = new AuthController(); // cho phep import model nay vao file khac
