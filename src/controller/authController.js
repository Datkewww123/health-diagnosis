const User = require('../model/user'); //save user into database
const bcrypt = require('bcrypt'); // su dung thu vien bcrypt de ma hoa mat khau
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

async forgotpassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      // Nếu không tìm thấy user
      if (!user) {
        return res.status(404).json({ message: 'Email không tồn tại!' });
      }

      // Tao va luu OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; 
      await user.save();
      // Bước 1: Trả lời Frontend NGAY LẬP TỨC (để nó chuyển trang nhập OTP luôn)
      res.status(200).json({ 
          message: 'Đã gửi mail thành công! Vui lòng kiểm tra hòm thư.' 
      });
      const mailOptions = {
        from: '"Health Care Support" <nguyendatz567@gmail.com>',
        to: email,
        subject: 'Mã xác thực để lấy lại mật khẩu',
        text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút`
      };

        transporter.sendMail(mailOptions).catch((err) => {});
    } 
    catch (err) {
      // Chỉ bắt lỗi nếu chưa kịp trả lời Frontend
      if (!res.headersSent) {
          res.status(500).json({ message: err.message });
      }
    }
  };
  //Verify OTP
  async verifyOtp(req, res){
    try{
      const{email, otp} = req.body;
      const user = await User.findOne({email});
      if(!user){
        return res.status(404).json({message:'User không tồn tại!'});
      }
      if(user.otp !== otp){
        return res.status(400).json({message:'Mã OTP không chính xác!'})
      }
      if(user.otpExpires < Date.now()){
        return res.status(400).json({message:'Mã OTP đã hết hiệu lục'});
      }
      res.json({message:'Xác thực OTP thành công, bạn có thể đặt lại mật khẩu'});
    }
    catch(err){
      return res.status(500).json({message: err.message});
    }
  };
// Reset password
async resetPassword(req, res){
  try{
    const { email, otp, newPassword} = req.body;
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({message:'User không tồn tại!'});
    }
    if(user.otp !== otp){
      return res.status(404).json({message:'Mã OTP không chính xác!'});
    }
    if( user.otpExpires < Date.now()){
      return res.status(404).json({message:'Mã OTP đã hết hạn'})
    }
    // ma hoa mat khau moi
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({message:'Đổi mật khẩu thành công! Vui lòng đăng nhập lại'});
  }
  catch(err){
    return res.status(500).json({message: err.message});
  }
};
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
