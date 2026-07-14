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
  
  // State quản lý chế độ đăng nhập: 'user' | 'doctor' | 'admin'
  const [loginMode, setLoginMode] = useState<'user' | 'doctor' | 'admin'>('user');



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

      if (data && data.token) {
        let roleValue = data.role || data.user?.role;
        if (!roleValue) {
          const decoded = decodeJWT(data.token);
          roleValue = decoded?.role;
        }
        roleValue = (roleValue || "user").toString().trim().toLowerCase();

        // Lưu ngay vào localStorage trước navigate() để AdminRoute đọc đúng role (tránh race condition)
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", roleValue);
        localStorage.setItem("user", JSON.stringify(data.user || { Username }));

        // Update centralized Auth state
        setAuthLogin(data.token, data.user || { Username }, roleValue);

        toast.success(`Đăng nhập vai trò ${
          roleValue === "doctor" ? "Bác sĩ" : roleValue === "admin" ? "Quản trị viên" : "Thành viên"
        } thành công!`);

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
          } else if (roleValue === "admin") {
            navigate("/admin/dashboard");
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

  // Cấu hình UI theo chế độ đăng nhập
  const getModeConfig = () => {
    switch (loginMode) {
      case 'doctor':
        return {
          title: "Cổng Đăng Nhập Bác Sĩ",
          desc: "Vui lòng nhập tài khoản công tác được cấp để quản trị bệnh án.",
          userLabel: "Mã số Bác sĩ / Email công vụ",
          userPlaceholder: "VD: bv115duongminhlinh...",
          passPlaceholder: "Nhập mật khẩu công vụ",
          colorClass: "text-sky-600 dark:text-sky-400",
          btnColor: "bg-sky-600 hover:bg-sky-700 focus:ring-sky-500",
        };
      case 'admin':
        return {
          title: "Cổng Đăng Nhập Quản Trị Viên",
          desc: "Khu vực quản lý hệ thống. Chỉ dành cho quản trị viên được phân quyền.",
          userLabel: "Tài khoản Quản trị viên (Admin)",
          userPlaceholder: "VD: admin...",
          passPlaceholder: "Nhập mật khẩu quản trị viên",
          colorClass: "text-purple-600 dark:text-purple-400",
          btnColor: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
        };
      default:
        return {
          title: "Chào mừng quay lại!",
          desc: "Đăng nhập tài khoản của bạn để sử dụng đầy đủ các tính năng y khoa.",
          userLabel: "Tên đăng nhập hoặc Email",
          userPlaceholder: "Nhập tên đăng nhập hoặc email của bạn",
          passPlaceholder: "Nhập mật khẩu",
          colorClass: "text-slate-800 dark:text-slate-100",
          btnColor: "bg-primary hover:bg-primary-dark focus:ring-primary",
        };
    }
  };

  const config = getModeConfig();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className={`text-xl md:text-2xl font-extrabold transition-colors ${config.colorClass}`}>
            {config.title}
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            {config.desc}
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
              {config.userLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={Username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={config.userPlaceholder}
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
                placeholder={config.passPlaceholder}
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
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 ${config.btnColor} disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm`}
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
        {loginMode === 'user' && (
          <div className="text-center pt-2 text-xs font-medium text-slate-400">
            Chưa có tài khoản?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline font-bold transition-colors ml-1"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        )}

        {/* Khối đăng nhập chuyển vai trò */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center flex flex-col gap-2.5">
          {loginMode === 'user' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('doctor');
                  setUsername("");
                  setPassword("");
                  setFormError(null);
                }}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                🩺 Đăng nhập dành cho Bác sĩ
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('admin');
                  setUsername("");
                  setPassword("");
                  setFormError(null);
                }}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                🛡️ Đăng nhập dành cho Quản trị viên
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginMode('user');
                setUsername("");
                setPassword("");
                setFormError(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              ⬅️ Quay lại đăng nhập cho Bệnh nhân
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


