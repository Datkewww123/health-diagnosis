import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Key, Lock, Eye, EyeOff, ShieldAlert, ArrowLeft, Check } from "lucide-react";
import { verifyOtp, resetPassword } from "../api/auth";
import { useToast } from "../context/ToastContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1 = verify otp, 2 = reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) setEmail(savedEmail);
    const verified = sessionStorage.getItem("otpVerified");
    const savedOtp = sessionStorage.getItem("resetOtp");
    if (verified) {
      if (savedOtp) setOtp(savedOtp);
      setStep(2); // Skip verification step if already verified
    }
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const res = await verifyOtp({ email, otp });
      if (res && (res.ok || res.success || res.message)) {
        toast.success(res.message || "Xác minh mã OTP thành công. Vui lòng thiết lập mật khẩu mới.");
        setStep(2);
      } else {
        setFormError(res.error || "Xác minh mã OTP thất bại.");
      }
    } catch (err: any) {
      setFormError(err.message || "Kết nối mạng thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email, otp, newPassword });
      if (res && (res.ok || res.success || res.message)) {
        toast.success(res.message || "Đặt lại mật khẩu thành công!");
        try {
          sessionStorage.removeItem("resetEmail");
          sessionStorage.removeItem("resetOtp");
          sessionStorage.removeItem("otpVerified");
        } catch (err) {
          console.warn("SessionStorage remove failed", err);
        }
        setConfirmPassword("");
        setNewPassword("");
        navigate("/login");
      } else {
        setFormError(res.error || "Đặt lại mật khẩu thất bại.");
      }
    } catch (err: any) {
      setFormError(err.message || "Kết nối mạng thất bại.");
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
            Đặt lại mật khẩu
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1 ? "Vui lòng xác minh mã OTP" : "Nhập mật khẩu mới cho tài khoản của bạn"}
          </p>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* STEP 1: VERIFY OTP */}
        {step === 1 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
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

        {/* STEP 2: RESET PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4 animate-slide-up">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Nhập mật khẩu mới"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <Check className="h-4.5 w-4.5" />
              )}
              <span>{loading ? "Đang đặt lại..." : "Xác nhận đặt lại mật khẩu"}</span>
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
