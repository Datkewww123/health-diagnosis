const User = require('../model/user'); //save user into database
const bcrypt = require('bcrypt'); // su dung thu vien bcrypt de ma hoa mat khau
const jwt = require('jsonwebtoken'); //tao token sau khi login


class AuthController{
    async signup (req,res) { // lay du lieu nguoi dung gui len 
    try {
      const { First_name, Last_name, Username, phone, email, password, confirm_password } = req.body;
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
            {id: user._id,
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
//forgot password
  

}

module.exports = new AuthController(); // cho phep import model nay vao file khac
