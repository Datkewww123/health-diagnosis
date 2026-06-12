const mongoose = require('mongoose');
const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OtpCode = require('../model/otpcode');
const createTransporter = require("../config/mail");

// [FIX] Dùng JWT_SECRET từ env, không fallback "SECRET_KEY"
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

class AuthController {

  async signup(req, res) {
    try {
      const { First_name, Last_name, Username, phone, email, password } = req.body;

      const existEmail = await User.findOne({ email });
      if (existEmail)
        // [FIX] Dùng status code 400 thay vì 200 + {ok: false}
        return res.status(400).json({ message: "Email đã được sử dụng" });

      const existUsername = await User.findOne({ Username });
      if (existUsername)
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

      const hash = await bcrypt.hash(password, 10);

      await User.create({
        First_name,
        Last_name,
        Username,
        phone,
        email,
        password: hash,
      });

      // [FIX] Status 201 Created thay vì 200. Giữ ok:true để FE cũ check được
      return res.status(201).json({ ok: true, message: "Đăng ký thành công!" });
    } catch (err) {
      // [FIX] Không leak err.message ra client
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  }

  async login(req, res) {
    try {
      const { Username, password } = req.body;
      if (!Username || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu" });
      }

      const user = await User.findOne({ Username });
      if (!user)
        // [FIX] Status 401 Unauthorized thay vì 200 OK + message
        return res.status(401).json({ message: "Tên đăng nhập không tồn tại!" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ message: "Mật khẩu không chính xác!" });

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        getJwtSecret(),
        { expiresIn: "1d" }
      );

      // [FIX] Trả thêm user info (id, name, email, role) để FE không cần decode JWT
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          First_name: user.First_name,
          Last_name: user.Last_name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  }

  async logout(req, res) {
    res.status(200).json({ message: "Đăng xuất thành công!" });
  }

  async forgotpassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Vui lòng nhập email!" });
      }

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "Email không tìm thấy!" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      await OtpCode.deleteOne({ userId: user._id });

      await OtpCode.create({
        userId: user._id,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

      // [FIX] Gửi email TRƯỚC khi response
      // Trước đây trả response về ngay rồi mới send mail (fire-and-forget)
      const transporter = await createTransporter();
      await transporter.sendMail({
        from: `"Health Care Support" <${process.env.GMAIL_SENDER}>`,
        to: email,
        subject: "Mã OTP để đặt lại mật khẩu",
        text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
      });

      return res.status(200).json({ message: "OTP đã được gửi. Vui lòng kiểm tra email!" });

    } catch (err) {
      console.error(err);
      if (!res.headersSent)
        // [FIX] Không leak err.message ra client
        return res.status(500).json({ message: "Lỗi gửi OTP. Vui lòng thử lại sau!" });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Vui lòng nhập email và OTP!" });
      }

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "Email không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ userId: user._id });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại hoặc đã hết hạn!" });

      if (otpRecord.expiresAt < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn!" });

      const match = await bcrypt.compare(otp, otpRecord.otp);
      if (!match)
        return res.status(400).json({ message: "OTP không chính xác!" });

      return res.json({ message: "Xác thực OTP thành công." });

    } catch (err) {
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  }

  async resetpassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
      }

      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "Email không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ userId: user._id });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại hoặc đã hết hạn!" });

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
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  }
}

module.exports = new AuthController();
