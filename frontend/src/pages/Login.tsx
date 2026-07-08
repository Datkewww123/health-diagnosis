import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ShieldAlert, LogIn } from "lucide-react";
import { login as loginApi } from "../api/auth";
import { syncSearchHistoryToServer, syncPredictHistoryToServer } from "../api/history";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

function decodeJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.error("[decodeJWT] Error:", e);
    return null;
  }
}

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { login: setAuthLogin } = useAuth();

  const [Username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!Username || !password) {
      setFormError("Vui lòng điền tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi({ Username, password });
      console.log("[LOGIN] Full response data:", JSON.stringify(data));

      if (data && data.token) {
        let roleValue = data.role || data.user?.role;
        if (!roleValue) {
          const decoded = decodeJWT(data.token);
          roleValue = decoded?.role;
        }
        roleValue = (roleValue || "user").toString().trim().toLowerCase();

        // Update centralized Auth state
        setAuthLogin(data.token, data.user || { Username }, roleValue);

        toast.success("Đăng nhập thành công!");

        // Sync local history to server in background
        console.log("[LOGIN] Starting history sync...");
        Promise.all([syncSearchHistoryToServer(), syncPredictHistoryToServer()])
          .then(() => console.log("[LOGIN] History sync complete"))
          .catch((err) => console.warn("[LOGIN] History sync error:", err));

        if (onSuccess) {
          onSuccess();
        } else {
          if (roleValue === "doctor") {
            navigate("/doctor/dashboard");
          } else {
            navigate("/");
          }
        }
      } else {
        setFormError(data?.message || "Mật khẩu hoặc tài khoản chưa chính xác.");
      }
    } catch (err: any) {
      console.error("[LOGIN] Exception caught:", err);
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
            Chào mừng quay lại!
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            Đăng nhập tài khoản của bạn để sử dụng đầy đủ các tính năng y khoa
          </p>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={Username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email của bạn"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <LogIn className="h-4.5 w-4.5" />
            )}
            <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 text-xs font-medium text-slate-400">
          Chưa có tài khoản?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline font-bold transition-colors ml-1"
          >
            Tạo tài khoản mới
          </Link>
        </div>

        {/* Quick Login Helper */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
          <span className="block text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Đăng nhập nhanh để thử nghiệm
          </span>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername("bv115duongminhlinh");
                setPassword("123456");
                toast.success("Đã điền tài khoản Bác sĩ: bv115duongminhlinh!");
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/20 dark:border-sky-500/10 text-sky-700 dark:text-sky-400 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <span>Đăng nhập với tư cách Bác sĩ (bv115)</span>
              <span className="text-[10px] bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-md font-bold">Tự điền</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername("admin");
                setPassword("123456");
                toast.success("Đã điền tài khoản Quản trị viên: admin!");
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/10 text-purple-700 dark:text-purple-400 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <span>Đăng nhập với tư cách Quản trị viên</span>
              <span className="text-[10px] bg-purple-500/10 dark:bg-purple-500/20 px-2 py-0.5 rounded-md font-bold">Tự điền</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
