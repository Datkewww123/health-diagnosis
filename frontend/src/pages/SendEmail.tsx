import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, User, MessageSquare, Info, ChevronLeft, Send } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function SendEmail() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("Vui lòng điền tất cả các trường bắt buộc (*)");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    try {
      setLoading(true);

      const outboxKey = "__sent_emails";
      const item = {
        id: Date.now(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        createdAt: new Date().toISOString(),
        status: "saved-local",
      };

      try {
        const raw = localStorage.getItem(outboxKey);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(item);
        localStorage.setItem(outboxKey, JSON.stringify(arr));
        console.log("[SendEmail] Saved to localStorage:", item);
      } catch (storageErr) {
        console.error("[SendEmail] localStorage error:", storageErr);
        toast.error("Không thể lưu tin nhắn vào trình duyệt.");
        return;
      }

      await new Promise((r) => setTimeout(r, 700));

      toast.success("Tin nhắn đã được lưu vào máy và sẽ được gửi đi sau. Cảm ơn bạn!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        navigate("/contact");
      }, 1500);
    } catch (err: any) {
      console.error("Error handling send locally:", err);
      toast.error(err.message || "Lỗi khi xử lý tin nhắn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Gửi tin nhắn liên hệ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hãy gửi câu hỏi cho chúng tôi, đội ngũ bác sĩ sẽ phản hồi sớm nhất
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Họ tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên của bạn"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Số điện thoại
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 123 456 789"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề tin nhắn"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nội dung liên hệ <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Nhập chi tiết nội dung cần hỗ trợ..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
            >
              <Send className="h-4.5 w-4.5" />
              <span>{loading ? "Đang gửi..." : "Gửi tin nhắn"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all text-sm"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Quay lại</span>
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Info className="h-3.5 w-3.5" />
            <span>Email trực tiếp: <strong>info@healthcarepredict.com</strong></span>
          </p>
          <p className="text-xs text-slate-400">Thời gian phản hồi thông thường: 24 giờ làm việc</p>
        </div>
      </div>
    </div>
  );
}
