import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Key, ShieldAlert, ArrowLeft, Send, Check } from "lucide-react";
import { forgotPassword, verifyOtp } from "../api/auth";
import { useToast } from "../context/ToastContext";

interface ForgotPasswordProps {
  onSuccess?: () => void;
}

export default function ForgotPassword({ onSuccess }: ForgotPasswordProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError("Vui lòng nhập email của bạn.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      toast.success(res?.message || "Mã OTP đã được gửi đến email của bạn.");
      try {
        sessionStorage.setItem("resetEmail", email);
      } catch (err) {
        console.warn("SessionStorage write failed", err);
      }
      setSent(true);
    } catch (err: any) {
      setFormError(err.message || "Đã có lỗi mạng xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!otp) {
      setFormError("Vui lòng nhập mã OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp({ email, otp });
      toast.success(res?.message || "Xác minh mã OTP thành công.");
      try {
        sessionStorage.setItem("resetOtp", otp);
        sessionStorage.setItem("otpVerified", "1");
      } catch (err) {
        console.warn("SessionStorage write failed", err);
      }
      onSuccess && onSuccess();
      navigate("/reset-password");
    } catch (err: any) {
      setFormError(err.message || "Xác minh mã OTP thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-850 dark:text-slate-100">
            Quên mật khẩu?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sent ? "Nhập mã xác nhận OTP từ hộp thư của bạn" : "Nhập email của bạn để bắt đầu khôi phục mật khẩu"}
          </p>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Step 1: Request OTP */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sent}
                placeholder="username@domain.com"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  sent
                    ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                }`}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : sent ? (
              <Check className="h-4.5 w-4.5 text-emerald-500" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{loading ? "Đang xử lý..." : sent ? "Đã gửi mã xác thực" : "Gửi yêu cầu khôi phục"}</span>
          </button>
        </form>

        {/* Step 2: Verify OTP */}
        {sent && (
          <form onSubmit={handleVerify} className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-4 animate-slide-up">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mã xác thực OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP gồm 6 chữ số"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent hover:bg-accent-dark disabled:bg-slate-200 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <Check className="h-4.5 w-4.5" />
              )}
              <span>{loading ? "Đang xác minh..." : "Xác nhận mã OTP"}</span>
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
