import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ShieldAlert, Mail, Phone, UserPlus, Ruler, Weight } from "lucide-react";
import { signup } from "../api/auth";
import { useToast } from "../context/ToastContext";
import AddressPicker from "../components/AddressPicker";

interface SignupProps {
  onSuccess?: () => void;
}

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold";

const LABEL_CLASS =
  "block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider";

const SECTION_TITLE =
  "text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800";

export default function Signup({ onSuccess }: SignupProps) {
  const navigate = useNavigate();
  const toast = useToast();

  // --- Thông tin cơ bản ---
  const [First_name, setFirstName] = useState("");
  const [Last_name, setLastName] = useState("");
  const [Username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // --- Thông tin sức khỏe (optional) ---
  const [gender, setGender] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tính ngày sinh ISO nếu đủ 3 trường
  function buildDob(): string {
    if (!dobDay || !dobMonth || !dobYear) return "";
    const mm = String(dobMonth).padStart(2, "0");
    const dd = String(dobDay).padStart(2, "0");
    return `${dobYear}-${mm}-${dd}`;
  }

  // Tính tuổi preview
  function calcAge(): number | null {
    const dob = buildDob();
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const mDiff = today.getMonth() - d.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!First_name || !Last_name || !email || !password || !Username) {
      setFormError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    if (!phone) {
      setFormError("Vui lòng nhập số điện thoại của bạn.");
      return;
    }
    if (!fullAddress.trim() || fullAddress.split(",").length < 3) {
      setFormError("Vui lòng chọn đầy đủ địa chỉ: Tỉnh/TP → Quận/Huyện → Phường/Xã.");
      return;
    }
    if (password !== confirm) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (height && (Number(height) < 50 || Number(height) > 250)) {
      setFormError("Chiều cao không hợp lệ (50 – 250 cm).");
      return;
    }
    if (weight && (Number(weight) < 10 || Number(weight) > 300)) {
      setFormError("Cân nặng không hợp lệ (10 – 300 kg).");
      return;
    }

    setLoading(true);
    try {
      const data = await signup({
        First_name,
        Last_name,
        email,
        Username,
        password,
        phone,
        address: fullAddress,
        gender: gender || undefined,
        date_of_birth: buildDob() || undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
      });

      if (data?.ok) {
        toast.success("Đăng ký tài khoản thành công!");
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/login");
          }
        }, 1500);
      } else {
        setFormError(data?.message || "Không thể tạo tài khoản, vui lòng kiểm tra lại.");
      }
    } catch (err: any) {
      console.error("[SIGNUP] Exception caught:", err);
      setFormError(err.message || "Kết nối mạng thất bại.");
    } finally {
      setLoading(false);
    }
  }

  const age = calcAge();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-850 dark:text-slate-100">
            Tạo Tài Khoản Mới
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            Điền các thông tin sau để bắt đầu theo dõi sức khỏe và chẩn đoán bệnh
          </p>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ===== PHẦN 1: THÔNG TIN TÀI KHOẢN ===== */}
          <div className="space-y-4">
            <p className={SECTION_TITLE}>
              <User className="h-3.5 w-3.5" /> Thông tin tài khoản
            </p>

            {/* Họ & Tên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Họ (First name) *</label>
                <input
                  type="text"
                  value={First_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nguyễn"
                  required
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tên (Last name) *</label>
                <input
                  type="text"
                  value={Last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Văn A"
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={LABEL_CLASS}>Tên đăng nhập *</label>
              <div className="relative">
                <input
                  type="text"
                  value={Username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập duy nhất"
                  required
                  className={`${INPUT_CLASS} pl-10`}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className={`${INPUT_CLASS} pl-10`}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Số điện thoại *</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123456789"
                    required
                    className={`${INPUT_CLASS} pl-10`}
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Địa chỉ */}
            <AddressPicker onChange={setFullAddress} />
          </div>

          {/* ===== PHẦN 2: THÔNG TIN SỨC KHỎE (optional) ===== */}
          <div className="space-y-4">
            <p className={SECTION_TITLE}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Thông tin sức khỏe <span className="text-slate-400 normal-case font-semibold tracking-normal">(tùy chọn)</span>
            </p>

            {/* Giới tính */}
            <div>
              <label className={LABEL_CLASS}>Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {/* Ngày sinh - 3 dropdowns */}
            <div>
              <label className={LABEL_CLASS}>Ngày sinh</label>
              <div className="grid grid-cols-3 gap-2">
                {/* Ngày */}
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Ngày</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {/* Tháng */}
                <select
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Tháng</option>
                  {["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"].map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                {/* Năm */}
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Năm</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {/* Preview tuổi */}
              {age !== null && (
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Tuổi tính toán:{" "}
                  <span className="font-bold text-primary">{age} tuổi</span>
                </p>
              )}
            </div>

            {/* Chiều cao & Cân nặng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Chiều cao (cm)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    min={50}
                    max={250}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Cân nặng (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="60"
                    min={10}
                    max={300}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* ===== PHẦN 3: MẬT KHẨU ===== */}
          <div className="space-y-4">
            <p className={SECTION_TITLE}>
              <Lock className="h-3.5 w-3.5" /> Bảo mật
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    required
                    className={`${INPUT_CLASS} pl-10 pr-10`}
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
                <label className={LABEL_CLASS}>Xác nhận mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className={`${INPUT_CLASS} pl-10 pr-10`}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm mt-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <UserPlus className="h-4.5 w-4.5" />
            )}
            <span>{loading ? "Đang đăng ký..." : "Tạo Tài Khoản"}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-1 text-xs font-medium text-slate-400">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-bold transition-colors ml-1"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
