import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Clock, Facebook, Linkedin, Twitter, MessageSquare, Info, ShieldAlert } from "lucide-react";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liên hệ hỗ trợ</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100">
          📞 Kết nối với Healthcare Predict
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, thắc mắc cũng như hỗ trợ kỹ thuật cho bạn.
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Company Details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Info className="h-5 w-5" />
              Về Healthcare Predict
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Nền tảng ứng dụng công nghệ trí tuệ nhân tạo (AI) hỗ trợ chẩn đoán và dự đoán nguy cơ sức khỏe thông qua triệu chứng, giúp cộng đồng dễ dàng tiếp cận với kiến thức y học uy tín.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Cam kết dịch vụ
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Đảm bảo an toàn thông tin cá nhân, cung cấp hệ thống cảnh báo sớm chuyên nghiệp, minh bạch và khoa học nhất. Chúng tôi không ngừng hợp tác với các chuyên gia y tế để cải tiến thuật toán.
            </p>
          </div>
        </div>

        {/* Right Column: Contact Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Thông tin liên hệ
          </h2>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex gap-4">
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Email hỗ trợ</span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">support@healthcarepredict.com</span>
                <span className="text-slate-500 dark:text-slate-400 block">info@healthcarepredict.com</span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Điện thoại Hotline</span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">+84 (0) 123 456 789</span>
                <span className="text-slate-500 dark:text-slate-400 block">+84 (0) 987 654 321</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex gap-4">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Địa chỉ văn phòng</span>
                <span className="text-slate-550 dark:text-slate-400 leading-relaxed block mt-0.5">
                  Tầng 12, Tòa nhà ABC, 123 Đường Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh, Việt Nam
                </span>
              </div>
            </div>

            {/* Clock */}
            <div className="flex gap-4">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Thời gian làm việc</span>
                <span className="text-slate-550 dark:text-slate-400 block mt-0.5">Thứ 2 - Thứ 6: 08:00 - 17:00</span>
                <span className="text-slate-550 dark:text-slate-400 block">Thứ 7: 09:00 - 12:00 (Chủ nhật nghỉ)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEND EMAIL CTA CARD */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 p-6 md:p-8 rounded-2xl border border-sky-100/50 dark:border-slate-800 text-center space-y-4">
        <h3 className="text-lg font-bold text-primary">Bạn có câu hỏi hoặc phản hồi khẩn cấp?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-350 max-w-md mx-auto leading-relaxed">
          Hãy soạn một email gửi tới cho chúng tôi. Đội ngũ y tế sẽ cố gắng trả lời và hỗ trợ bạn trong vòng 24 giờ.
        </p>
        <button
          onClick={() => window.location.href = "mailto:info@healthcarepredict.com"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span>Soạn tin nhắn liên hệ</span>
        </button>
      </div>

      {/* SOCIAL MEDIA CONNECTIONS */}
      <div className="text-center space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kết nối mạng xã hội</h3>
        <div className="flex gap-4 justify-center">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-slate-950 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title="Twitter X"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-[#0A66C2] text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
