const User = require('../model/user');
const createTransporter = require('../config/mail');

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

async function sendEmailFromUser(userEmail, recipientEmail, subject, text) {
  const transporter = await createTransporter();
  return transporter.sendMail({
    from: userEmail,
    to: recipientEmail,
    subject,
    text
  });
}

exports.sendLeaveEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const { recipientName, recipientEmail, disease, days, company, position } = req.body;
    if (!recipientName || !recipientEmail || !disease) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (recipientName, recipientEmail, disease)' });
    }

    const leaveLetter = generateLeaveLetter(
      user,
      { name: recipientName, email: recipientEmail },
      disease,
      days || 1,
      company,
      position
    );

    // [FIX] await email TRƯỚC khi response - không còn fire-and-forget
    // Trước đây: sendEmailFromUser(...).then(() => {...}).catch(() => {...}) và trả response ngay
    // Lỗi bị nuốt, user luôn thấy success dù email không gửi được
    await sendEmailFromUser(
      user.email,
      recipientEmail,
      `Đơn xin nghỉ phép – ${user.First_name} ${user.Last_name}`,
      leaveLetter
    );

    console.log('Email gửi thành công tới', recipientEmail);

    return res.json({
      message: 'Email đã được gửi thành công!',
      leaveLetter
    });

  } catch (err) {
    console.error("Lỗi gửi email:", err);
    // [FIX] Không leak err.message ra client
    return res.status(500).json({
      message: 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau!'
    });
  }
};
