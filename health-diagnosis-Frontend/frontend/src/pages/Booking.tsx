import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getNearbyHospitals, getDoctorsByHospital, bookAppointment, BookingData, updateAppointmentStatus } from "../api/appointment";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { 
  MapPin, Stethoscope, Calendar, Clock, Navigation, 
  UserCheck, Hospital as HospitalIcon, Loader2, ArrowLeft,
  CheckCircle, ChevronRight, MessageSquare, Map, Hash, FileText,
  CreditCard, DollarSign, Printer
} from "lucide-react";
import AddressPicker from "../components/AddressPicker";
import { getUserProfile } from "../api/user";

interface HospitalData {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  image_url: string;
  description: string;
  distance: number;
}

interface DoctorData {
  id: number;
  hospital_id: number;
  name: string;
  specialty: string;
  phone: string;
  experience_years: number;
  fee: string;
  bio: string;
}

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { user, refreshAuth } = useAuth();

  // Nhận thông tin bệnh lý truyền từ DiseaseDetail.tsx
  const stateData = location.state as { diseaseId?: number; diseaseName?: string; department?: string } | null;
  const diseaseId = stateData?.diseaseId;
  const diseaseName = stateData?.diseaseName;
  const department = stateData?.department;

  // States
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState<boolean>(false);

  // Lựa chọn đặt lịch
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);

  // Form đặt lịch
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("08:00");
  const [notes, setNotes] = useState<string>("");
  const [paymentType, setPaymentType] = useState<'service' | 'insurance'>("service");
  const [insuranceCardNumber, setInsuranceCardNumber] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  const [locationMethod, setLocationMethod] = useState<'registered' | 'custom' | null>(null);
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Cấu hình GPS hoặc Địa chỉ đăng ký
  const handleSelectRegistered = useCallback(async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng địa chỉ nhà riêng!");
      return;
    }

    let lat = user.latitude;
    let lng = user.longitude;

    // Nếu thông tin local thiếu tọa độ, tự động gọi API để fetch bản mới nhất từ database
    if (!lat || !lng) {
      try {
        setGpsLoading(true);
        const freshUser = await getUserProfile();
        const userData = freshUser.user || freshUser;
        if (userData && userData.latitude && userData.longitude) {
          lat = userData.latitude;
          lng = userData.longitude;
          
          // Đồng bộ lại local storage để lần sau không cần fetch nữa
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.latitude = lat;
            parsed.longitude = lng;
            parsed.address = userData.address;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
          if (refreshAuth) refreshAuth();
        }
      } catch (err) {
        console.warn("Không thể fetch tọa độ mới từ server:", err);
      } finally {
        setGpsLoading(false);
      }
    }

    if (!lat || !lng) {
      toast.error("Tài khoản của bạn chưa có định vị tọa độ địa chỉ nhà riêng. Vui lòng cập nhật đầy đủ địa chỉ cụ thể (bao gồm Tỉnh/TP, Quận/Huyện) tại trang Hồ sơ cá nhân hoặc chọn 'Tự chọn địa chỉ khám tạm thời'!");
      return;
    }

    setLocationMethod('registered');
    setGpsLoading(true);
    setUserCoords({ lat: Number(lat), lng: Number(lng) });
    setGpsLoading(false);
    fetchHospitals(Number(lat), Number(lng));
    toast.success("Đã định vị theo địa chỉ nhà riêng!");
  }, [user, refreshAuth]);

  const handleSelectCustomAddress = async () => {
    if (!customAddress || customAddress.split(",").length < 3) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/TP, Quận/Huyện, Phường/Xã!");
      return;
    }

    setIsGeocoding(true);
    setLocationMethod('custom');
    try {
      const parts = customAddress.split(',').map(p => p.trim()).filter(Boolean);
      const queries = [];
      if (parts.length >= 2) {
        for (let i = 1; i < parts.length; i++) {
          queries.push(parts.slice(i).join(', ') + ', Vietnam');
        }
      }
      queries.push(customAddress + ', Vietnam');

      let lat = 10.775;
      let lng = 106.666;
      let found = false;

      for (const q of queries) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=vn`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Healthcare-Predict-Client' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
            found = true;
            break;
          }
        }
      }

      setUserCoords({ lat, lng });
      fetchHospitals(lat, lng);
      if (found) {
        toast.success("Đã xác định vị trí tạm thời thành công!");
      } else {
        toast.warning("Không tìm thấy tọa độ chính xác, sử dụng vị trí mặc định tại TP.HCM.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi định vị địa chỉ tạm thời.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Tự động kiểm tra nếu user đã có địa chỉ đăng ký thì ưu tiên dùng luôn
  useEffect(() => {
    if (user && user.latitude && user.longitude) {
      handleSelectRegistered();
    }
  }, [user, handleSelectRegistered]);

  // Tự động cuộn lên đầu trang khi đặt lịch thành công
  useEffect(() => {
    if (successBooking) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [successBooking]);

  // Bước 2: Tải danh sách bệnh viện trong bán kính 10km
  async function fetchHospitals(lat: number, lng: number) {
    try {
      setLoadingHospitals(true);
      // Tìm bệnh viện gần nhất, truyền kèm department để ưu tiên tìm bệnh viện có chuyên khoa tương ứng
      const res = await getNearbyHospitals(lat, lng, department);
      if (res && res.data) {
        setHospitals(res.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tìm kiếm danh sách bệnh viện gần đây.");
    } finally {
      setLoadingHospitals(false);
    }
  }

  // Bước 3: Khi chọn bệnh viện, tải danh sách bác sĩ
  async function handleSelectHospital(hospital: HospitalData) {
    setSelectedHospital(hospital);
    setSelectedDoctor(null);
    setDoctors([]);
    try {
      setLoadingDoctors(true);
      // Lấy bác sĩ của bệnh viện đó, lọc theo khoa y học của bệnh lý (nếu có)
      const res = await getDoctorsByHospital(hospital.id, department);
      if (res && res.data) {
        setDoctors(res.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách bác sĩ của bệnh viện này.");
    } finally {
      setLoadingDoctors(false);
    }
  }

  // Bước 4: Đặt lịch khám
  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHospital || !selectedDoctor || !date || !time) {
      toast.error("Vui lòng điền đầy đủ các thông tin hẹn lịch khám!");
      return;
    }

    if (paymentType === 'insurance') {
      const cleanCardNum = insuranceCardNumber.replace(/\s+/g, "").toUpperCase();
      if (!cleanCardNum) {
        toast.error("Vui lòng nhập số thẻ Bảo hiểm Y tế (BHYT) của bạn!");
        return;
      }
      if (cleanCardNum.length !== 15) {
        toast.error("Số thẻ BHYT không hợp lệ! Thẻ BHYT chuẩn Việt Nam phải có đúng 15 ký tự (Ví dụ: GD4797912345678).");
        return;
      }
    }

    try {
      setBookingLoading(true);
      const bookingData: BookingData = {
        doctor_id: selectedDoctor.id,
        hospital_id: selectedHospital.id,
        disease_id: diseaseId || null,
        disease_name: diseaseName || undefined,
        appointment_date: date,
        appointment_time: time,
        notes: notes || `Hẹn khám cho bệnh lý: ${diseaseName || 'Không xác định'}`,
        payment_type: paymentType,
        insurance_card_number: paymentType === 'insurance' ? insuranceCardNumber.replace(/\s+/g, "").toUpperCase() : undefined
      };

      const res = await bookAppointment(bookingData);
      if (res && res.data) {
        setSuccessBooking(res.data);
        toast.success("Đặt lịch khám y tế thành công!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đặt lịch thất bại. Vui lòng thử lại!");
    } finally {
      setBookingLoading(false);
    }
  }

  if (successBooking) {
    const formattedDate = successBooking.appointment_date
      ? successBooking.appointment_date.split("-").reverse().join("/")
      : "";
    const formattedTime = successBooking.appointment_time
      ? successBooking.appointment_time.slice(0, 5)
      : "";

    // Tuổi và giới tính tiếng Việt
    const dob = user?.date_of_birth ? new Date(user.date_of_birth) : null;
    const today = new Date();
    let ageStr = "--";
    if (dob) {
      let ageVal = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) ageVal--;
      ageStr = `${ageVal} tuổi`;
    }
    const genderStr = user?.gender === "male" ? "Nam" : user?.gender === "female" ? "Nữ" : user?.gender === "other" ? "Khác" : "--";
    const bmiStr = (user?.height && user?.weight)
      ? (Number(user.weight) / Math.pow(Number(user.height) / 100, 2)).toFixed(1)
      : null;

    const sttNum = String(successBooking.stt_kham || 1).padStart(2, "0");

    // Hàm hủy lịch hẹn trực tiếp từ trang thành công
    async function handleCancelBooking() {
      // TODO: Replace with a proper ConfirmModal component for UI consistency
      if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn khám vừa đặt không?")) {
        return;
      }
      try {
        await updateAppointmentStatus(successBooking.id, "cancelled");
        toast.success("Hủy lịch khám thành công!");
        // Reset lại form
        setSuccessBooking(null);
        setSelectedHospital(null);
        setSelectedDoctor(null);
        setDate("");
        setNotes("");
      } catch (err: any) {
        toast.error(err.message || "Không thể hủy lịch khám. Vui lòng thử lại!");
      }
    }


    return (
      <>
        {/* GIAO DIỆN WEB THÀNH CÔNG (ẨN KHI IN) */}
        <div className="max-w-2xl mx-auto my-8 p-6 md:p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 md:space-y-8 print:hidden">
          {/* Pulsing Check Circle */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 animate-pulse">
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10"></div>
              <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 relative z-10" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Đặt lịch thành công!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Yêu cầu hẹn khám của bạn đã được gửi tới bệnh viện. Chúng tôi sẽ liên hệ xác nhận cuộc hẹn sớm nhất.
            </p>
          </div>

          {/* Detailed Booking Box */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 md:p-6 border border-slate-100 dark:border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200/50 dark:bg-slate-800 rounded-lg">
                  <Hash className="h-4 w-4 text-slate-550 dark:text-slate-450" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Mã cuộc hẹn</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">#LH-{successBooking.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <HospitalIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bệnh viện</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{successBooking.Hospital?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bác sĩ khám</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{successBooking.Doctor?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Stethoscope className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Chuyên khoa</span>
                  <span className="font-extrabold text-sm text-amber-600 dark:text-amber-405">{successBooking.Doctor?.specialty}</span>
                </div>
              </div>
            </div>

            {diseaseName && (
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                    <FileText className="h-4 w-4 text-rose-600 dark:text-rose-455" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Lý do khám (Bệnh)</span>
                    <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">{diseaseName}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Thời gian khám</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {formattedTime} - Ngày {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Loại hình khám & BHYT */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Hình thức đăng ký</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {successBooking.payment_type === 'insurance' ? 'Khám Bảo hiểm Y tế (BHYT)' : 'Khám Dịch vụ (Tự chi trả)'}
                  </span>
                  {successBooking.insurance_card_number && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">Số thẻ BHYT: {successBooking.insurance_card_number}</p>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                successBooking.payment_type === 'insurance' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 border border-amber-200/50 animate-pulse' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200/50'
              }`}>
                {successBooking.payment_type === 'insurance' ? 'Mức ưu tiên: Thường' : 'Mức ưu tiên: Cao ⭐'}
              </span>
            </div>

            {/* Chi phí tạm tính */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Chi phí thực tế tạm tính</span>
                  <span className="font-extrabold text-sm text-slate-850 dark:text-slate-200">
                    {(() => {
                      const feeVal = Number(successBooking.Doctor?.fee || 0);
                      const isIns = successBooking.payment_type === 'insurance';
                      const finalCost = isIns ? Math.max(0, feeVal * 0.2) : feeVal;
                      return `${finalCost.toLocaleString()} VNĐ`;
                    })()}
                  </span>
                  {successBooking.payment_type === 'insurance' && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      (Đã giảm trừ 80% chi phí do BHYT hỗ trợ chi trả)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center items-center flex-wrap">
            <Link
              to="/"
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              Về trang chủ
            </Link>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In phiếu khám bệnh
            </button>
            <button
              onClick={handleCancelBooking}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Hủy lịch hẹn vừa đặt
            </button>
            <Link
              to="/history?tab=booking"
              className="px-5 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              Xem lịch sử đặt lịch
            </Link>
            <button
              onClick={() => {
                setSuccessBooking(null);
                setSelectedHospital(null);
                setSelectedDoctor(null);
                setDate("");
                setNotes("");
              }}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all cursor-pointer"
            >
              Đặt lịch khám khác
            </button>
          </div>
        </div>

        {/* GIAO DIỆN PHIẾU KHÁM THỰC TẾ (CHỈ HIỂN THỊ KHI IN) */}
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm 14mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
        <div className="hidden print:block w-full bg-white text-black font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-black pb-2 mb-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-black font-bold">SỞ Y TẾ THÀNH PHỐ HỒ CHÍ MINH</p>
              <p className="text-xs font-black uppercase text-black mt-0.5">{successBooking.Hospital?.name || 'BỆNH VIỆN ĐA KHOA CẤP CỨU'}</p>
              <p className="text-[9px] text-black max-w-md mt-0.5">{successBooking.Hospital?.address}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-black">Mã phiếu: <strong>#LH-{successBooking.id}</strong></p>
              <div className="mt-1 inline-block border border-black px-2.5 py-1 text-center rounded-sm">
                <p className="text-[7px] font-bold text-black uppercase tracking-wider leading-none">Số Thứ Tự Khám</p>
                <p className="text-3xl font-black text-black leading-none mt-0.5">{sttNum}</p>
              </div>
            </div>
          </div>

          {/* Tiêu đề */}
          <div className="text-center mb-3">
            <h1 className="text-base font-black tracking-wide uppercase">PHIẾU ĐĂNG KÝ KHÁM BỆNH</h1>
            <p className="text-[8px] italic text-black mt-0.5">(Dành cho bệnh nhân đặt lịch hẹn trực tuyến)</p>
            <p className="text-[8px] font-bold text-black mt-0.5">Ngày in phiếu: {new Date().toLocaleDateString("vi-VN")} lúc {new Date().toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}</p>
          </div>

          {/* I. Thông tin bệnh nhân */}
          <div className="border border-black rounded-sm p-2 mb-2">
            <h3 className="text-[8px] font-black uppercase border-b border-black pb-1 mb-1.5">I. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
              <p><strong>Họ và tên:</strong> <span className="uppercase font-bold">{user?.First_name} {user?.Last_name}</span></p>
              <p><strong>Ngày sinh:</strong> {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString("vi-VN") : "--"} ({ageStr})</p>
              <p><strong>Giới tính:</strong> {genderStr}</p>
              <p><strong>Số điện thoại:</strong> {user?.phone || "--"}</p>
              <p className="col-span-2"><strong>Địa chỉ:</strong> {user?.address || "--"}</p>
              {user?.height && user?.weight && (
                <p className="col-span-2 border-t border-dashed border-black pt-1 mt-1 flex gap-4">
                  <span><strong>Chiều cao:</strong> {user.height} cm</span>
                  <span><strong>Cân nặng:</strong> {user.weight} kg</span>
                  <span><strong>BMI:</strong> {bmiStr} ({Number(bmiStr!) < 18.5 ? "Gầy" : Number(bmiStr!) < 24.9 ? "Bình thường" : "Thừa cân"})</span>
                </p>
              )}
            </div>
          </div>

          {/* II. Chi tiết lịch hẹn */}
          <div className="border border-black rounded-sm p-2 mb-2">
            <h3 className="text-[8px] font-black uppercase border-b border-black pb-1 mb-1.5">II. CHI TIẾT LỊCH HẸN KHÁM</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
              <p><strong>Chuyên khoa:</strong> {successBooking.Doctor?.specialty}</p>
              <p><strong>Bác sĩ phụ trách:</strong> {successBooking.Doctor?.name}</p>
              <p><strong>Ngày hẹn:</strong> <strong>{formattedDate}</strong></p>
              <p><strong>Giờ hẹn:</strong> <strong>{formattedTime}</strong></p>
              <p><strong>Phòng khám:</strong> Phòng {100 + (successBooking.id % 20)} - Lầu 1</p>
              <p><strong>Hình thức:</strong> <span className="uppercase font-bold">{successBooking.payment_type === 'insurance' ? 'Bảo hiểm y tế' : 'Dịch vụ'}</span></p>
              {successBooking.insurance_card_number && (
                <p className="col-span-2"><strong>Số thẻ BHYT:</strong> <span className="font-mono font-bold">{successBooking.insurance_card_number}</span></p>
              )}
              {diseaseName && (
                <p className="col-span-2"><strong>Bệnh lý / Triệu chứng:</strong> {diseaseName}</p>
              )}
              <p className="col-span-2"><strong>Ghi chú:</strong> {successBooking.notes || 'Không có.'}</p>
            </div>
          </div>

          {/* III. Chi phí */}
          <div className="border border-black rounded-sm p-2 mb-2 bg-white">
            <h3 className="text-[8px] font-black uppercase border-b border-black pb-1 mb-1.5">III. CHI PHÍ KHÁM LÂM SÀNG</h3>
            <div className="flex justify-between items-center text-[9px]">
              <div>
                <p><strong>Giá khám niêm yết:</strong> {Number(successBooking.Doctor?.fee || 0).toLocaleString()} VNĐ</p>
                {successBooking.payment_type === 'insurance' && (
                  <p className="font-bold mt-0.5">Giảm trừ BHYT: -80% giá niêm yết (-{(Number(successBooking.Doctor?.fee || 0) * 0.8).toLocaleString()} VNĐ)</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[7px] font-bold uppercase">Tổng tiền tạm tính</p>
                <p className="text-sm font-black mt-0.5">
                  {(() => {
                    const feeVal = Number(successBooking.Doctor?.fee || 0);
                    const finalCost = successBooking.payment_type === 'insurance' ? Math.max(0, feeVal * 0.2) : feeVal;
                    return `${finalCost.toLocaleString()} VNĐ`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Lưu ý */}
          <div className="text-[8px] text-black border border-black px-2 py-1.5 rounded-sm mb-2 space-y-0.5">
            <p className="font-black uppercase">⚠️ Lưu ý dành cho bệnh nhân:</p>
            <p>1. Mang theo <strong>Thẻ BHYT gốc + CCCD</strong> để đối chiếu khi đến.</p>
            <p>2. Có mặt tại <strong>Quầy tiếp nhận số 1</strong> trước giờ hẹn <strong>15 phút</strong>.</p>
            <p>3. Phiếu này là xác nhận đặt lịch trực tuyến, chưa phải số thứ tự chính thức.</p>
          </div>

          {/* Chữ ký */}
          <div className="grid grid-cols-2 gap-4 text-[9px] text-center mt-3">
            <div>
              <p className="italic">Ngày ..... tháng ..... năm 2026</p>
              <p className="font-bold uppercase mt-0.5">NGƯỜI LẬP PHIẾU</p>
              <p className="text-[7px]">(Ký, ghi rõ họ tên)</p>
              <div className="h-10 flex items-center justify-center">
                <span className="italic text-[9px]">Hệ thống Healthcare</span>
              </div>
            </div>
            <div>
              <p className="italic">Ngày ..... tháng ..... năm 2026</p>
              <p className="font-bold uppercase mt-0.5">BỆNH NHÂN XÁC NHẬN</p>
              <p className="text-[7px]">(Ký, ghi rõ họ tên)</p>
              <div className="h-10 flex items-center justify-center">
                <span className="font-bold uppercase">{user?.First_name} {user?.Last_name}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chủ
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Hẹn lịch khám bác sĩ gần nhất</h1>
        {diseaseName && (
          <p className="text-muted-foreground mt-2">
            Hệ thống đang hỗ trợ đặt khám liên quan tới bệnh lý: <span className="font-bold text-primary">{diseaseName}</span> ({department})
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT 1 & 2: Bệnh viện và Bác sĩ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lựa chọn 1: Bệnh viện gần nhất */}
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <HospitalIcon className="w-5 h-5 text-primary" />
                <span>Bước 1: Chọn bệnh viện phù hợp (Bán kính 10km)</span>
              </span>
            </h2>

            {locationMethod === null ? (
              <div className="py-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Để tìm các bệnh viện chuyên khoa trong bán kính 10km, vui lòng chọn phương thức xác định vị trí của bạn:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleSelectRegistered}
                    className="p-5 border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-center items-center gap-3 group h-32"
                  >
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-foreground text-sm text-center">Địa chỉ nhà riêng đã đăng ký</span>
                  </button>
                  
                  {/* Nút bấm mở panel tự nhập địa chỉ tạm thời */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomPicker(prev => !prev);
                    }}
                    className={`p-5 border-2 rounded-xl text-left flex flex-col justify-center items-center gap-3 group h-32 transition-all ${
                      showCustomPicker 
                        ? "border-amber-500 bg-amber-500/5" 
                        : "border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-500/5"
                    }`}
                  >
                    <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Map className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-foreground text-sm text-center">Tự chọn địa chỉ khám tạm thời</span>
                  </button>
                </div>

                {/* Khối nhập địa chỉ tạm thời hiển thị động dưới dạng card trượt */}
                {showCustomPicker && (
                  <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>Nhập địa chỉ tạm thời để tìm bệnh viện xung quanh:</span>
                    </h4>
                    <AddressPicker onChange={setCustomAddress} />
                    <button
                      type="button"
                      onClick={handleSelectCustomAddress}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                      Xác nhận vị trí tạm thời
                    </button>
                  </div>
                )}
              </div>
            ) : gpsLoading || loadingHospitals || isGeocoding ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Đang xác định vị trí và tìm bệnh viện gần nhất...</span>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
                  <span className="text-muted-foreground">
                    Định vị theo: <strong className="text-foreground">{locationMethod === 'registered' ? 'Địa chỉ nhà' : 'Địa chỉ tạm thời'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocationMethod(null)}
                    className="text-primary hover:underline font-bold font-sans"
                  >
                    Thay đổi vị trí &larr;
                  </button>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center text-muted-foreground border">
                  Không tìm thấy bệnh viện nào trong bán kính 10km có chuyên khoa phù hợp với vị trí của bạn.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
                  <span className="text-muted-foreground">
                    Định vị theo: <strong className="text-foreground">{locationMethod === 'registered' ? 'Địa chỉ nhà' : 'Địa chỉ tạm thời'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocationMethod(null)}
                    className="text-primary hover:underline font-bold font-sans"
                  >
                    Thay đổi vị trí &larr;
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => handleSelectHospital(hospital)}
                    className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedHospital?.id === hospital.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-slate-300 dark:hover:border-slate-700 bg-background"
                    }`}
                  >

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <h3 className="font-bold text-foreground">{hospital.name}</h3>
                        <span className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          <Navigation className="w-3 h-3 mr-1" />
                          Cách {Number(hospital.distance).toFixed(1)} km
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{hospital.address}</span>
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic pt-1">
                        {hospital.description}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Lựa chọn 2: Bác sĩ điều trị */}
          {selectedHospital && (
            <div className="bg-card border rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <span>Bước 2: Chọn bác sĩ khám chuyên khoa</span>
              </h2>

              {loadingDoctors ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Không tìm thấy bác sĩ nào thuộc chuyên khoa phù hợp tại bệnh viện này hiện tại.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-4 border rounded-lg cursor-pointer flex flex-col justify-between transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-slate-300 dark:hover:border-slate-700 bg-background"
                      }`}
                    >
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{doctor.name}</h3>
                          <span className="text-xs text-primary font-semibold">{doctor.specialty}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {doctor.bio}
                        </p>
                      </div>

                      <div className="border-t pt-3 mt-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{doctor.experience_years} năm kinh nghiệm</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT 3: Xác nhận & Đặt hẹn */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Bước 3: Hẹn giờ & Đặt lịch</span>
            </h2>

            <form onSubmit={handleBook} className="space-y-4">
              {/* Review Tóm tắt */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border text-xs space-y-2">
                <div>
                  <span className="text-muted-foreground block">Bệnh viện:</span>
                  <span className="font-semibold text-foreground">{selectedHospital ? selectedHospital.name : "Chưa chọn"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Bác sĩ:</span>
                  <span className="font-semibold text-foreground">{selectedDoctor ? selectedDoctor.name : "Chưa chọn"}</span>
                </div>
                {diseaseName && (
                  <div>
                    <span className="text-muted-foreground block">Mục đích khám:</span>
                    <span className="font-semibold text-primary">{diseaseName} ({department})</span>
                  </div>
                )}
              </div>

              {/* Nhập ngày khám */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Chọn ngày khám
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:border-primary text-sm"
                  required
                />
              </div>

              {/* Nhập giờ khám */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Chọn giờ khám
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:border-primary text-sm"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:30">04:30 PM</option>
                </select>
              </div>

              {/* Nhập ghi chú triệu chứng */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ghi chú cho bác sĩ (nếu có)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Tôi bị sốt cao kèm đau đầu dữ dội khoảng 2 ngày nay..."
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:border-primary text-sm min-h-[80px] resize-none"
                />
              </div>

              {/* Hình thức đăng ký khám */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Hình thức đăng ký
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('service')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === 'service'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-200">Khám Dịch vụ</span>
                    <span className="block text-[10px] text-slate-500 font-bold mt-0.5">⭐ Ưu tiên khám</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('insurance')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === 'insurance'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-200">Khám BHYT</span>
                    <span className="block text-[10px] text-slate-500 font-bold mt-0.5">🕒 Theo hàng chờ</span>
                  </button>
                </div>
              </div>

              {/* Nhập mã thẻ BHYT nếu chọn BHYT */}
              {paymentType === 'insurance' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Mã số thẻ BHYT (15 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={insuranceCardNumber}
                    onChange={(e) => setInsuranceCardNumber(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: GD4797912345678"
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:border-primary text-sm uppercase font-mono tracking-wider"
                    required={paymentType === 'insurance'}
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    * BHYT chi trả 80% theo giá trần dịch vụ quy định của Bộ Y tế.
                  </p>
                </div>
              )}

              {/* Chi phí tạm tính trong form */}
              {selectedDoctor && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giá gốc bác sĩ:</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-350">{Number(selectedDoctor.fee).toLocaleString()} VNĐ</span>
                  </div>
                  {paymentType === 'insurance' && (
                    <>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-450">
                        <span>BHYT chi trả (80%):</span>
                        <span className="font-extrabold">-{(Number(selectedDoctor.fee) * 0.8).toLocaleString()} VNĐ</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold text-sm">
                    <span>Tổng tiền trả:</span>
                    <span className="text-primary font-black">
                      {(() => {
                        const feeVal = Number(selectedDoctor.fee || 0);
                        const finalCost = paymentType === 'insurance' ? Math.max(0, feeVal * 0.2) : feeVal;
                        return `${finalCost.toLocaleString()} VNĐ`;
                      })()}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={bookingLoading || !selectedHospital || !selectedDoctor}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng ký lịch...
                  </>
                ) : (
                  "Xác nhận đặt lịch khám"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
