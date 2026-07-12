import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Edit2, LogOut, Check, AlertTriangle, Eye, EyeOff, MapPin } from "lucide-react";
import { getUserProfile, updateUserProfile } from "../api/user";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import defaultAvatar from "../Logo/DefaultAvatar.jpg";
import AddressPicker from "../components/AddressPicker";

interface ProfileData {
  First_name: string;
  Last_name: string;
  Username: string;
  email: string;
  phone: string;
  address?: string;
  height?: number | string;
  weight?: number | string;
  date_of_birth?: string;
  gender?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { role, logout, refreshAuth } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({
    First_name: "",
    Last_name: "",
    Username: "",
    email: "",
    phone: "",
    address: "",
    height: "",
    weight: "",
    date_of_birth: "",
    gender: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState("");
  // 3 state riêng cho ngày sinh — chọn theo bất kỳ thứ tự nào
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await getUserProfile();
      const userData = res.user || res;
      const data = {
        First_name: userData.First_name || "",
        Last_name: userData.Last_name || "",
        Username: userData.Username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        height: userData.height !== undefined && userData.height !== null ? userData.height : "",
        weight: userData.weight !== undefined && userData.weight !== null ? userData.weight : "",
        date_of_birth: userData.date_of_birth || "",
        gender: userData.gender || "",
      };
      setProfile(data);
      // Khởi tạo 3 state ngày sinh từ dữ liệu server
      if (userData.date_of_birth) {
        const dateOnly = userData.date_of_birth.substring(0, 10);
        const parts = dateOnly.split("-");
        setDobYear(parts[0] || "");
        setDobMonth(parts[1] ? String(parseInt(parts[1], 10)) : "");
        setDobDay(parts[2] ? String(parseInt(parts[2], 10)) : "");
      }
      // Set giới tính từ dữ liệu server
      if (userData.gender) {
        setProfile(prev => ({ ...prev, gender: userData.gender }));
      }
      setFormError(null);
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setFormError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    setFormError(null);

    if (!profile.First_name.trim() || !profile.Last_name.trim()) {
      setFormError("Tên và họ không được để trống");
      return;
    }

    try {
      setLoading(true);
      if ((dobYear || dobMonth || dobDay) && !(dobYear && dobMonth && dobDay)) {
        setFormError("Vui lòng chọn đầy đủ ngày, tháng, năm sinh.");
        setLoading(false);
        return;
      }

      const builtDob = (dobYear && dobMonth && dobDay)
        ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
        : profile.date_of_birth || null;

      const updatePayload: any = {
        First_name: profile.First_name,
        Last_name: profile.Last_name,
        email: profile.email,
        phone: profile.phone,
        height: profile.height !== "" ? Number(profile.height) : null,
        weight: profile.weight !== "" ? Number(profile.weight) : null,
        date_of_birth: builtDob,
        gender: profile.gender || null,
      };

      // Nếu người dùng đã chọn địa chỉ mới thì đưa vào payload
      if (newAddress && newAddress.split(",").length >= 3) {
        updatePayload.address = newAddress;
      }

      if (passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword) {
        updatePayload.oldPassword = passwordData.oldPassword;
        updatePayload.newPassword = passwordData.newPassword;
        updatePayload.confirmPassword = passwordData.confirmPassword;
      }

      const res = await updateUserProfile(updatePayload);

      const updatedUserData = res.user || res;
      const updatedProfile = {
        First_name: updatedUserData.First_name || updatedUserData.first_name || profile.First_name,
        Last_name: updatedUserData.Last_name || updatedUserData.last_name || profile.Last_name,
        Username: updatedUserData.Username || updatedUserData.username || profile.Username,
        email: updatedUserData.email || profile.email,
        phone: updatedUserData.phone || profile.phone,
        address: updatedUserData.address || profile.address,
        height: updatedUserData.height !== undefined && updatedUserData.height !== null ? updatedUserData.height : "",
        weight: updatedUserData.weight !== undefined && updatedUserData.weight !== null ? updatedUserData.weight : "",
        date_of_birth: updatedUserData.date_of_birth || profile.date_of_birth || "",
        gender: updatedUserData.gender || "",
      };

      setProfile(updatedProfile);
      
      // Đồng bộ thông tin user mới cập nhật vào AuthContext và localStorage
      const storedUserString = localStorage.getItem("user");
      if (storedUserString) {
        try {
          const currentStoredUser = JSON.parse(storedUserString);
          const mergedUser = {
            ...currentStoredUser,
            First_name: updatedProfile.First_name,
            Last_name: updatedProfile.Last_name,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            address: updatedProfile.address,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            date_of_birth: updatedProfile.date_of_birth,
            gender: updatedProfile.gender,
            latitude: updatedUserData.latitude || updatedUserData.Latitude,
            longitude: updatedUserData.longitude || updatedUserData.Longitude,
          };
          localStorage.setItem("user", JSON.stringify(mergedUser));
        } catch (e) {
          console.error("Lỗi đồng bộ localStorage user:", e);
        }
      }
      
      // Kích hoạt load lại trạng thái auth trên toàn hệ thống
      if (refreshAuth) {
        refreshAuth();
      }
      window.dispatchEvent(new CustomEvent("auth-change", { detail: { role: updatedUserData.role } }));

      toast.success(res.message || "Cập nhật thông tin thành công!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setNewAddress("");
      setEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setFormError(err.message || "Cập nhật profile thất bại");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    toast.success("Đã đăng xuất thành công!");
    navigate("/");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
        {/* Profile Avatar & Header */}
        <div className="text-center">
          <div className="relative inline-block h-28 w-28 rounded-full overflow-hidden border-4 border-primary shadow-sm mb-4">
            <img src={defaultAvatar} alt="avatar" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100">Hồ sơ cá nhân</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-primary/10 text-primary text-xs font-bold rounded-full">
            <span>Vai trò:</span>
            <span className="uppercase">{role}</span>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {loading && !editing ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : editing ? (
          /* EDITING MODE FORM */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Họ
                </label>
                <input
                  type="text"
                  name="First_name"
                  value={profile.First_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên
                </label>
                <input
                  type="text"
                  name="Last_name"
                  value={profile.Last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <input
                type="text"
                name="Username"
                value={profile.Username}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tên đăng nhập không thể thay đổi</span>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Giới tính
              </label>
              <select
                name="gender"
                value={profile.gender || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>


            {/* Chiều cao, Cân nặng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleInputChange}
                  placeholder="cm"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleInputChange}
                  placeholder="kg"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Ngày tháng năm sinh - 3 dropdowns độc lập */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ngày tháng năm sinh
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Ngày */}
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                >
                  <option value="">Tháng</option>
                  {["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"].map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>

                {/* Năm */}
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                >
                  <option value="">Năm</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Preview tuổi — hiện ngay khi đủ cả 3 */}
              {dobDay && dobMonth && dobYear && (
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Tuổi tính toán:{" "}
                  <span className="font-bold text-primary">
                    {(() => {
                      const dob = new Date(
                        Number(dobYear),
                        Number(dobMonth) - 1,
                        Number(dobDay)
                      );
                      const today = new Date();
                      let age = today.getFullYear() - dob.getFullYear();
                      const m = today.getMonth() - dob.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                      return `${age} tuổi`;
                    })()}
                  </span>
                </p>
              )}
            </div>

            {/* Cập nhật địa chỉ */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <AddressPicker onChange={setNewAddress} className="mt-2" />
              {!newAddress && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Bỏ qua nếu không muốn thay đổi địa chỉ hiện tại.
                </p>
              )}
            </div>

            {/* Password edit section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Thay đổi mật khẩu</h4>
                <p className="text-[11px] text-slate-400">Để trống nếu không muốn thay đổi mật khẩu</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Mật khẩu hiện tại"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Mật khẩu mới"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-5 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-350 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          /* READ-ONLY VIEW MODE */
          <div className="space-y-5">
            {/* Biometric stats grid: Chiều cao, Cân nặng, Ngày sinh */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chiều cao</span>
                <span className="text-base font-black text-slate-850 dark:text-slate-100">
                  {profile.height ? `${profile.height} cm` : "--"}
                </span>
              </div>
              
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cân nặng</span>
                <span className="text-base font-black text-slate-850 dark:text-slate-100">
                  {profile.weight ? `${profile.weight} kg` : "--"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tuổi</span>
                <span className="text-base font-black text-slate-850 dark:text-slate-100">
                  {profile.date_of_birth ? (() => {
                    const dob = new Date(profile.date_of_birth!);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                    return `${age} tuổi`;
                  })() : "--"}
                </span>
              </div>
            </div>

            {/* Ngày sinh chi tiết */}
            {profile.date_of_birth && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="text-2xl">🎂</div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày sinh</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {new Date(profile.date_of_birth!).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic BMI calculator badge */}
            {profile.height && profile.weight && (
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chỉ số thể trọng BMI</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 block">
                    {(() => {
                      const h = Number(profile.height) / 100;
                      const w = Number(profile.weight);
                      const bmi = w / (h * h);
                      return `${bmi.toFixed(1)} kg/m²`;
                    })()}
                  </span>
                </div>
                <div className="text-right">
                  {(() => {
                    const h = Number(profile.height) / 100;
                    const w = Number(profile.weight);
                    const bmi = w / (h * h);
                    if (bmi < 18.5) return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20">Cân nặng thấp (Gầy)</span>;
                    if (bmi < 24.9) return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">Thể trạng bình thường</span>;
                    if (bmi < 29.9) return <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-lg border border-orange-500/20">Tiền béo phì (Thừa cân)</span>;
                    return <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20">Béo phì</span>;
                  })()}
                </div>
              </div>
            )}

            {/* Giới tính chi tiết */}
            {profile.gender && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="text-xl">👫</div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giới tính</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {profile.gender === "male" ? "Nam" : profile.gender === "female" ? "Nữ" : "Khác"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <User className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {profile.First_name} {profile.Last_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <User className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tên đăng nhập</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">@{profile.Username}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <Mail className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <Phone className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.phone || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.address || "Chưa có địa chỉ"}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
              >
                <Edit2 className="h-4.5 w-4.5" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold border border-rose-100 transition-all text-sm"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
