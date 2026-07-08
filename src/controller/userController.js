const User = require('../model/user');
const bcrypt = require('bcrypt');
const https = require('https');

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Healthcare-Predict' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

/** Tính tuổi chính xác từ ngày sinh (YYYY-MM-DD) */
function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

exports.getUser = async (req, res) => {
  try {
    const userID = req.user.userId;
    const user = await User.findByPk(userID, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại!" });
    }
    // Trả về map thuộc tính camelCase cho tương thích frontend cũ nếu cần,
    // hoặc trả trực tiếp đối tượng
    return res.json({
      id: user.id,
      First_name: user.first_name,
      Last_name: user.last_name,
      Username: user.username,
      phone: user.phone,
      email: user.email,
      address: user.address,
      role: user.role,
      height: user.height,
      weight: user.weight,
      date_of_birth: user.date_of_birth,
      age: calcAge(user.date_of_birth),
      gender: user.gender,
      latitude: user.latitude,
      longitude: user.longitude
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin user" });
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
      address,
      oldPassword,
      newPassword,
      confirmPassword,
      height,
      weight,
      date_of_birth,
      gender
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại!" });
    }

    let updateData = {};

    // Cập nhật thông tin profile bình thường
    if (First_name) updateData.first_name = First_name;
    if (Last_name) updateData.last_name = Last_name;
    if (Username) updateData.username = Username;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (height !== undefined) updateData.height = height ? Number(height) : null;
    if (weight !== undefined) updateData.weight = weight ? Number(weight) : null;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
    if (gender !== undefined) updateData.gender = gender || null;

    // Geocode địa chỉ mới nếu có
    if (address && address.trim()) {
      updateData.address = address.trim();
      try {
        const parts = address.split(',').map(p => p.trim()).filter(Boolean);
        const bbox = '&viewbox=102.14,8.18,109.46,23.39&bounded=1';
        const queries = [];
        if (parts.length >= 2) {
          for (let i = 1; i < parts.length; i++) {
            queries.push(parts.slice(i).join(', ') + ', Vietnam');
          }
        }
        queries.push(address + ', Vietnam');
        let geoData = [];
        for (const q of queries) {
          geoData = await httpsGetJson(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=vn${bbox}`
          );
          if (geoData && geoData.length > 0) {
            const lat = parseFloat(geoData[0].lat);
            const lon = parseFloat(geoData[0].lon);
            if (lat >= 8.18 && lat <= 23.39 && lon >= 102.14 && lon <= 109.46) {
              updateData.latitude = lat;
              updateData.longitude = lon;
              console.log(`[Profile Geocoder] "${q}" → ${lat}, ${lon}`);
              break;
            }
          }
          await new Promise(r => setTimeout(r, 400));
        }
      } catch (geoErr) {
        console.error('[Profile Geocoder] Error:', geoErr.message);
      }
    }

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

    // Thực hiện update trong MySQL
    await User.update(updateData, { where: { id: userId } });

    // Lấy lại thông tin user sau khi cập nhật
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    return res.json({
      message: "Cập nhật thành công!",
      user: {
        id: updatedUser.id,
        First_name: updatedUser.first_name,
        Last_name: updatedUser.last_name,
        Username: updatedUser.username,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        role: updatedUser.role,
        height: updatedUser.height,
        weight: updatedUser.weight,
        date_of_birth: updatedUser.date_of_birth,
        age: calcAge(updatedUser.date_of_birth),
        gender: updatedUser.gender
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật profile" });
  }
};
