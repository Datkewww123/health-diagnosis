const User = require('../model/user'); //save user into database
const bcrypt = require('bcrypt'); // su dung thu vien bcrypt de ma hoa mat khau
const OtpCode = require('../model/otpcode'); // lay thu vien
const jwt = require('jsonwebtoken'); //tao token sau khi login
const nodemailer = require('nodemailer');// 
// 1. Khai bao email , password ben .env de bao mat
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASS 
  }
});
class AuthController{
  //signup
    async signup (req,res) { // lay du lieu nguoi dung gui len 
    try {
      const { First_name, Last_name, Username, phone, email, password} = req.body;
      const existEmail = await User.findOne({email});
      if(existEmail){ // kiem tra xem email nay co duoc su dung chua 
        return res.json({ok: false, message:"Email is already in used"});
      }
      const userName = await User.findOne({Username});
      if(userName){ //kiem tra xem user name nay da co ai su dung chua
        return res.json({ok: false, message:"User name is already taken"});
      }
      const hash = await bcrypt.hash(password, 10); //10 vong => so vong ma hoa , mk that se khong bao gio duoc luu vao db
      await User.create({ // luu user vao database
        First_name,
        Last_name,
        Username,
        phone,
        email,
        password: hash,
      });
      return res.json({ok: true, message:"Sign Up successfull!"}) // tra ve respone
    }
    catch(err){
        return res.json({ok: false, message:"Server Error!", error: err});
    }
}

//Login
async login (req, res){
    try{
        const{Username, password} = req.body; // lay user name tu database
        const user = await User.findOne({Username}); // kiem tra xem user co ton tai khong
        if(!user){
            return res.json({message:"User name not found!"});
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            return res.json({message:"Incorrect password!"});
        }
        const token = jwt.sign( // tao JWT token
            {userId: user._id,
              role: user.role
            }, // token chua id cua user
            "SECRET KEY", //khoa ky token
            {expiresIn: "1d"} //het han sau 1 ngay
        );
        return res.json({token}); // tra token ve cho fe
    }
catch(err){
    return res.json({message:"Server Error", Error: err});
}
}
//logout
  async logout (req, res){
    res.status(200).json({message:'Logout successful!'});
  };
// forgot password
  async forgotpassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'Email không tìm thấy!' });

      // Tạo OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      // Lưu vào OtpCode collection, xóa OTP cũ nếu có
      await OtpCode.findOneAndDelete({ userId: user._id });
      await OtpCode.create({
        userId: user._id,
        otp: hashedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      res.status(200).json({ message: 'OTP đã được gửi thành công. Vui lòng kiểm tra email của bạn!' });

      // Gửi email bất đồng bộ
      const mailOptions = {
        from: `"Health Care Support" <${process.env.MY_EMAIL}>`,
        to: email,
        subject: 'Mã OTP để đặt lại mật khẩu',
        text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`
      };

      transporter.sendMail(mailOptions).catch(err => console.error('SendMail error:', err));

    } catch (err) {
      if (!res.headersSent) res.status(500).json({ message: err.message });
    }
  }
  //Verify OTP
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
// Reset password
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

      // Hash mật khẩu mới
      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;
      await user.save();

      // Xóa OTP đã dùng
      await OtpCode.findByIdAndDelete(otpRecord._id);

      res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
// lay thong tin user hien tại
async getuser(req, res){
  try{
  const user = await User.findById(req.user.userId).select('-password -otp -otpExpires');//hide password and otp
  if(!user){
    return res.status(404).json({message:'User không tồn tại!'});
  }
  res.json(user);

}
catch(err){
  return res.status(500).json({message: err.message});
}

};}

module.exports = new AuthController(); // cho phep import model nay vao file khac
