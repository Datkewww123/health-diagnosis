const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OtpCode = require('../model/otpcode');
const createTransporter = require("../config/mail");
const https = require('https');

function httpsGetJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Healthcare-Predict',
        ...headers
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

class AuthController {

  async signup(req, res) {
    try {
      const { First_name, Last_name, Username, phone, email, password, address } = req.body;

      if (!address || !address.trim()) {
        return res.status(400).json({ message: "Địa chỉ là bắt buộc và không được bỏ trống" });
      }

      const existEmail = await User.findOne({ where: { email } });
      if (existEmail)
        return res.status(400).json({ message: "Email đã được sử dụng" });

      const existUsername = await User.findOne({ where: { username: Username } });
      if (existUsername)
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

      const hash = await bcrypt.hash(password, 10);

      // Định vị địa chỉ thông qua OpenStreetMap Nominatim
      // Địa chỉ đến từ AddressPicker có dạng: "Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP"
      let latitude = 10.7769; // Mặc định trung tâm TP.HCM
      let longitude = 106.7009;

      try {
        const parts = address.split(',').map(p => p.trim()).filter(Boolean);
        // Thử từ chi tiết nhất → tổng quát nhất, bắt đầu từ phần thứ 2 trở đi (bỏ số nhà)
        const queries = [];
        if (parts.length >= 2) {
          // "Phường/Xã, Quận/Huyện, Tỉnh/TP, Vietnam"
          for (let i = 1; i < parts.length; i++) {
            queries.push(parts.slice(i).join(', ') + ', Vietnam');
          }
        }
        queries.push(address + ', Vietnam'); // fallback toàn bộ

        // Bounding box toàn lãnh thổ Việt Nam để tránh kết quả ngoài biên giới
        const bbox = '&viewbox=102.14,8.18,109.46,23.39&bounded=1';

        let geoData = [];
        for (const q of queries) {
          geoData = await httpsGetJson(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=vn${bbox}`
          );
          if (geoData && geoData.length > 0) {
            const lat = parseFloat(geoData[0].lat);
            const lon = parseFloat(geoData[0].lon);
            // Kiểm tra toạ độ nằm trong lãnh thổ Việt Nam
            if (lat >= 8.18 && lat <= 23.39 && lon >= 102.14 && lon <= 109.46) {
              latitude = lat;
              longitude = lon;
              console.log(`[Signup Geocoder] Định vị "${q}" → Lat ${latitude}, Lng ${longitude}`);
              break;
            }
          }
          await new Promise(r => setTimeout(r, 400));
        }

        if (latitude === 10.7769) {
          console.warn(`[Signup Geocoder] Không tìm thấy toạ độ hợp lệ cho địa chỉ "${address}"`);
        }
      } catch (err) {
        console.error(`[Signup Geocoder] Lỗi gọi API Nominatim:`, err.message);
      }

      await User.create({
        first_name: First_name,
        last_name: Last_name,
        username: Username,
        phone,
        email,
        password: hash,
        address: address,
        latitude: latitude,
        longitude: longitude
      });

      return res.status(201).json({ ok: true, message: "Đăng ký thành công!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi đăng ký" });
    }
  }

  async login(req, res) {
    try {
      const { Username, password } = req.body;
      if (!Username || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu" });
      }

      const { Op } = require('sequelize');
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: Username },
            { email: Username }
          ]
        }
      });
      if (!user)
        return res.status(401).json({ message: "Tên đăng nhập hoặc email không tồn tại!" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ message: "Mật khẩu không chính xác!" });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        getJwtSecret(),
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          First_name: user.first_name,
          Last_name: user.last_name,
          Username: user.username,
          email: user.email,
          address: user.address,
          latitude: user.latitude,
          longitude: user.longitude,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi đăng nhập" });
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

      const user = await User.findOne({ where: { email } });
      if (!user)
        return res.status(404).json({ message: "Email không tìm thấy!" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      // Xóa OTP cũ nếu có
      await OtpCode.destroy({ where: { user_id: user.id } });

      // Lưu OTP mới
      await OtpCode.create({
        user_id: user.id,
        otp: hashedOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
      });

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
        return res.status(500).json({ message: "Lỗi gửi OTP. Vui lòng thử lại sau!" });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Vui lòng nhập email và OTP!" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user)
        return res.status(404).json({ message: "Email không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ where: { user_id: user.id } });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại hoặc đã hết hạn!" });

      if (new Date(otpRecord.expires_at).getTime() < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn!" });

      const match = await bcrypt.compare(otp, otpRecord.otp);
      if (!match)
        return res.status(400).json({ message: "OTP không chính xác!" });

      return res.json({ message: "Xác thực OTP thành công." });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi máy chủ khi xác thực OTP" });
    }
  }

  async resetpassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user)
        return res.status(404).json({ message: "Email không tồn tại!" });

      const otpRecord = await OtpCode.findOne({ where: { user_id: user.id } });
      if (!otpRecord)
        return res.status(400).json({ message: "OTP không tồn tại hoặc đã hết hạn!" });

      if (new Date(otpRecord.expires_at).getTime() < Date.now())
        return res.status(400).json({ message: "OTP đã hết hạn!" });

      const match = await bcrypt.compare(otp, otpRecord.otp);
      if (!match)
        return res.status(400).json({ message: "OTP không chính xác!" });

      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;
      await user.save();

      // Xóa OTP sau khi đổi thành công
      await OtpCode.destroy({ where: { id: otpRecord.id } });

      return res.json({ message: "Đặt lại mật khẩu thành công!" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi máy chủ khi đặt lại mật khẩu" });
    }
  }
}

module.exports = new AuthController();
