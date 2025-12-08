const User = require('../model/user'); // lay schema tu model user
const bcrypt = require('bcrypt'); // dung de hash lai mat khau

exports.getUser = async(req, res)=>{
    try{
        const userID = req.user.userId;
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

exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
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

        // Cập nhật thông tin profile bình thường
        if (First_name) updateData.First_name = First_name;
        if (Last_name) updateData.Last_name = Last_name;
        if (Username) updateData.Username = Username;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;

        // Kiểm tra xem user có đang muốn đổi mật khẩu không
        const wantChangePassword =
            (oldPassword && oldPassword.trim() !== "") ||
            (newPassword && newPassword.trim() !== "") ||
            (confirmPassword && confirmPassword.trim() !== "");

        // Nếu có ý định đổi mật khẩu → xử lý
        if (wantChangePassword) {

            // Check nhập thiếu
            if (!oldPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    message: "Vui lòng nhập đầy đủ thông tin để đổi mật khẩu!"
                });
            }

            // Lấy user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User không tồn tại!" });
            }

            // Check mật khẩu cũ
            const match = await bcrypt.compare(oldPassword, user.password);
            if (!match) {
                return res.status(400).json({
                    message: "Mật khẩu cũ không đúng vui lòng nhập lại!"
                });
            }

            // Check confirm
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: "Mật khẩu không trùng nhau!" });
            }

            // Hash mật khẩu mới
            const hashed = await bcrypt.hash(newPassword, 10);
            updateData.password = hashed;
        }

        // Không có gì để update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Không có gì được cập nhật!" });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        return res.json({
            message: "Cập nhật thành công!",
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
