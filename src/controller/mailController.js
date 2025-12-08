// src/controller/mailController.js
const User = require('../model/user');
const createTransporter = require('../config/mail'); // mail.js sử dụng OAuth2

// Tạo template đơn nghỉ phép
function generateLeaveLetter(user, recipient, disease, days, company, position) {
  return `
Kính gửi ${recipient.name},

Tôi là ${user.First_name} ${user.Last_name}, hiện đang công tác tại ${company || "[Công ty chưa nhập]"} với vai trò ${position || "[Vị trí chưa nhập]"}.
Do sức khỏe không tốt và được chẩn đoán mắc ${disease}, tôi xin phép được nghỉ làm trong vòng ${days} ngày, kể từ hôm nay, để điều trị và hồi phục.

Trong thời gian nghỉ, tôi sẽ cố gắng bàn giao công việc cần thiết hoặc thông báo cho đồng nghiệp để đảm bảo tiến độ.

Rất mong ${recipient.name} thông cảm và chấp thuận đơn xin nghỉ của tôi.

Trân trọng,
${user.First_name} ${user.Last_name}  
Email: ${user.email}
  `;
}

// Hàm gửi email từ Gmail user với OAuth2
async function sendEmailFromUser(userEmail, recipientEmail, subject, text) {
  const transporter = await createTransporter();
  return transporter.sendMail({
    from: userEmail,
    to: recipientEmail,
    subject,
    text
  });
}

// Controller chính
exports.sendLeaveEmail = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy thông tin user từ DB
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const { recipientName, recipientEmail, disease, days, company, position } = req.body;

    if (!recipientName || !recipientEmail || !disease) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Tạo template
    const leaveLetter = generateLeaveLetter(
      user,
      { name: recipientName, email: recipientEmail },
      disease,
      days || 1,
      company,
      position
    );

    // Gửi email
    await sendEmailFromUser(
      user.email,
      recipientEmail,
      `Đơn xin nghỉ phép – ${user.First_name} ${user.Last_name}`,
      leaveLetter
    );

    return res.json({ success: true, message: 'Email đã gửi thành công', leaveLetter });

  } catch (err) {
    console.error("Lỗi gửi email:", err);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi email',
      error: err.message
    });
  }
};
