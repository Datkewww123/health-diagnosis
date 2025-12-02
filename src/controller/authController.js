require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OtpCode = require('../model/otpcode');
const createTransporter = require("../config/mail");

class AuthController {

  // Signup
  async signup(req, res) {
    try {
      const { First_name, Last_name, Username, phone, email, password } = req.body;

      const existEmail = await User.findOne({ email });
      if (existEmail)
        return res.json({ ok: false, message: "Email is already in use" });

      const existUsername = await User.findOne({ Username });
      if (existUsername)
        return res.json({ ok: false, message: "Username is already taken" });

      const hash = await bcrypt.hash(password, 10);

      await User.create({
        First_name,
        Last_name,
        Username,
        phone,
        email,
        password: hash,
      });

      return res.json({ ok: true, message: "Sign Up successful!" });
    } catch (err) {
      return res.json({ ok: false, message: "Server Error!", error: err });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { Username, password } = req.body;
      const user = await User.findOne({ Username });

      if (!user)
        return res.json({ message: "User name not found!" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.json({ message: "Incorrect password!" });

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || "SECRET_KEY",
        { expiresIn: "1d" }
      );

      return res.json({ token });
    } catch (err) {
      return res.json({ message: "Server Error", Error: err });
    }
  }

  // Logout
  async logout(req, res) {
    res.status(200).json({ message: "Logout successful!" });
  }

  // Forgot Password
  async forgotpassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "Email không tìm thấy!" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      // Xóa OTP cũ
      await OtpCode.deleteOne({ userId: user._id });

      // Tạo OTP mới
      await OtpCode.create({
        userId: user._id,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

      res.status(200).json({ message: "OTP đã được gửi. Vui lòng kiểm tra email!" });

      // Tạo transporter OAuth2 & gửi email
      const transporter = await createTransporter();
      await transporter.sendMail({
        from: `"Health Care Support" <${process.env.GMAIL_SENDER}>`,
        to: email,
        subject: "Mã OTP để đặt lại mật khẩu",
        text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
      });

    } catch (err) {
      console.error(err);
      if (!res.headersSent)
        res.status(500).json({ message: err.message });
    }
  }

  // Verify OTP
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "User không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ userId: user._id });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại!" });

      if (otpRecord.expiresAt < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn!" });

      const match = await bcrypt.compare(otp, otpRecord.otp);
      if (!match)
        return res.status(400).json({ message: "OTP không chính xác!" });

      return res.json({ message: "Xác thực OTP thành công." });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Reset Password
  async resetpassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "User không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ userId: user._id });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại!" });

      if (otpRecord.expiresAt < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn!" });

      const match = await bcrypt.compare(otp, otpRecord.otp);
      if (!match)
        return res.status(400).json({ message: "OTP không chính xác!" });

      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;
      await user.save();

      await OtpCode.findByIdAndDelete(otpRecord._id);

      return res.json({ message: "Đặt lại mật khẩu thành công!" });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Get User
  async getuser(req, res) {
    try {
      const user = await User.findById(req.user.userId).select("-password");
      if (!user)
        return res.status(404).json({ message: "User không tồn tại!" });

      return res.json(user);

    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new AuthController();
