const User = require('../model/user'); // lay schema tu model user
const bcrypt = require('bcrypt'); // dung de hash lai mat khau

exports.getUser = async(req, res)=>{
    try{
        const userID = req.user.userId;;
        const user = await User.findById(userID).select('-password');
        if(!user){
            return res.status(404).json({message: "User không tồn tại!"});
        }
        res.json(user);
    }
    catch(err){
        return res.status(500).json({message: err.message})
    }
};

exports.updateUser = async(req, res) => {
    try{
        const userId = req.user.userId;
        const{
        First_name,
        Last_name,
        Username,
        phone,
        email,
        oldPassword,
        newPassword,
        confirmPassword
        } = req.body;

        let updateData = {};

        //Update profile binh thuong
        if(First_name) updateData.First_name = First_name;
        if(Last_name) updateData.Last_name = Last_name;
        if(Username) updateData.Username = Username;
        if(phone) updateData.phone = phone;
        if(email) updateData.email = email;

        //Update pasword neu co request

        if(oldPassword ||newPassword || confirmPassword ){
            if(!oldPassword || !newPassword || !confirmPassword){
                return res.status(400).json({message: "Vui lòng nhập đầy đủ thông tin để đổi mật khẩu!"});
            }
            const user = await User.findById(userId);
            if(!user){
                return res.status(404).json({message:"User không tồn tại!"});
            }
            const match = await bcrypt.compare(oldPassword, user.password);
            if(!match){
                return res.status(400).json({message:"Mật khẩu cũ không đúng vui lòng nhập lại!"});
            }
            if(newPassword !== confirmPassword){
                return res.status(400).json({message:"Mật khẩu không trùng nhau!"});
            }
        
            const hashed = await bcrypt.hash(newPassword, 10); // hash 10 lan de khong bi lo du lieu
            updateData.password = hashed;
        }
            if(Object.keys(updateData).length === 0){
                return res.status(400).json({message:"Không có gì được cập nhật!"});
            }
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                {new: true, runValidators: true}).select('-password');
                return res.json({message:"Cập nhật thành công!", user: updatedUser});
        }
         catch(err){
            return res.status(500).json({message: err.message});
    }
}

