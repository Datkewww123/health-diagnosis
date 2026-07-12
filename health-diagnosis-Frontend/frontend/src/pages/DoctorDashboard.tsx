import React, { useEffect, useState } from "react";
import { 
  getDoctorAppointments, 
  updateAppointmentStatus, 
  getPatientHealthProfile,
  getDoctorProfile,
  updateDoctorProfile,
  updateTreatment,
  searchMedicines
} from "../api/appointment";
import { useToast } from "../context/ToastContext";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  Inbox,
  RefreshCw,
  Heart,
  Activity,
  Scale,
  Ruler,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  Stethoscope,
  ClipboardList,
  History,
  AlertCircle,
  Info,
  Search,
  Users,
  Settings,
  Download,
  BarChart2,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
  Printer
} from "lucide-react";

interface AppointmentItem {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  payment_type?: 'service' | 'insurance';
  insurance_card_number?: string;
  result_notes?: string;
  prescription?: string;
  User?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
  };
  Hospital?: {
    name: string;
    address: string;
  };
  Disease?: {
    name: string;
  };
  Doctor?: {
    name: string;
    specialty: string;
  };
}

interface PatientProfile {
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string | null;
    gender: 'male' | 'female' | 'other' | null;
    height: number | null;
    weight: number | null;
    bmi: number | null;
  };
  diagnosisHistory: Array<{
    id: number;
    type: 'search' | 'predict';
    query_text: string | null;
    disease_name: string;
    input_symptoms: string[] | null;
    createdAt: string;
  }>;
  appointmentHistory: Array<{
    id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    notes: string | null;
    Doctor?: { name: string; specialty: string };
    Hospital?: { name: string; address: string };
    Disease?: { name: string };
  }>;
}

interface DoctorProfileData {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  experience_years: number;
  fee: number;
  bio: string;
  Hospital?: {
    name: string;
    address: string;
  };
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Thiếu cân", color: "text-blue-500" };
  if (bmi < 25) return { label: "Bình thường", color: "text-emerald-500" };
  if (bmi < 30) return { label: "Thừa cân", color: "text-amber-500" };
  return { label: "Béo phì", color: "text-rose-500" };
}

function calcAge(dob: string | null): string {
  if (!dob) return "Chưa cập nhật";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} tuổi`;
}

// Modal Hồ sơ sức khỏe bệnh nhân
function PatientHealthModal({ userId, patientName, onClose }: { userId: number; patientName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnosis' | 'appointments'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getPatientHealthProfile(userId);
        setProfile(res.data || res);
      } catch (err: any) {
        setError(err.message || "Không thể tải hồ sơ bệnh nhân.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const genderLabel = (g: string | null) => {
    if (g === 'male') return 'Nam';
    if (g === 'female') return 'Nữ';
    if (g === 'other') return 'Khác';
    return 'Chưa cập nhật';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary/10 via-sky-500/10 to-emerald-500/10 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Hồ sơ Bệnh nhân</p>
              <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">{patientName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          {[
            { id: 'overview', label: 'Thông tin cơ bản', icon: <User className="h-3.5 w-3.5" /> },
            { id: 'diagnosis', label: 'Lịch sử chẩn đoán', icon: <Activity className="h-3.5 w-3.5" /> },
            { id: 'appointments', label: 'Lịch sử hẹn khám', icon: <CalendarIcon className="h-3.5 w-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <Skeleton key={n} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-10 w-10 text-rose-400" />
              <p className="text-sm font-bold text-rose-500">{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Tab: Thông tin cơ bản */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Thông tin cá nhân */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Thông tin cá nhân
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: <User className="h-4 w-4 text-primary/70" />, label: "Họ & tên", value: `${profile.patient.last_name} ${profile.patient.first_name}` },
                        { icon: <CalendarIcon className="h-4 w-4 text-sky-500/70" />, label: "Ngày sinh", value: profile.patient.date_of_birth ? new Date(profile.patient.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật' },
                        { icon: <Activity className="h-4 w-4 text-emerald-500/70" />, label: "Tuổi", value: calcAge(profile.patient.date_of_birth) },
                        { icon: <User className="h-4 w-4 text-violet-500/70" />, label: "Giới tính", value: genderLabel(profile.patient.gender) },
                        { icon: <Phone className="h-4 w-4 text-amber-500/70" />, label: "Điện thoại", value: profile.patient.phone || "Chưa cập nhật" },
                        { icon: <Mail className="h-4 w-4 text-rose-500/70" />, label: "Email", value: profile.patient.email },
                        { icon: <MapPin className="h-4 w-4 text-slate-400" />, label: "Địa chỉ", value: profile.patient.address || "Chưa cập nhật" },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chỉ số sức khỏe */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" /> Chỉ số sức khỏe
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-2xl p-4 text-center">
                        <Ruler className="h-5 w-5 text-sky-500 mx-auto mb-1" />
                        <p className="text-2xl font-black text-sky-700 dark:text-sky-400">
                          {profile.patient.height ?? '—'}
                        </p>
                        <p className="text-[10px] font-bold text-sky-500 uppercase">cm · Chiều cao</p>
                      </div>
                      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4 text-center">
                        <Scale className="h-5 w-5 text-violet-500 mx-auto mb-1" />
                        <p className="text-2xl font-black text-violet-700 dark:text-violet-400">
                          {profile.patient.weight ?? '—'}
                        </p>
                        <p className="text-[10px] font-bold text-violet-500 uppercase">kg · Cân nặng</p>
                      </div>
                      <div className={`bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-center`}>
                        <Activity className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        <p className={`text-2xl font-black ${profile.patient.bmi ? getBMICategory(profile.patient.bmi).color : 'text-slate-400'}`}>
                          {profile.patient.bmi ?? '—'}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">
                          BMI {profile.patient.bmi ? `· ${getBMICategory(profile.patient.bmi).label}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Lịch sử chẩn đoán */}
              {activeTab === 'diagnosis' && (
                <div className="space-y-3">
                  {profile.diagnosisHistory.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                      <ClipboardList className="h-10 w-10" />
                      <p className="text-sm font-bold">Bệnh nhân chưa có lịch sử chẩn đoán</p>
                    </div>
                  ) : (
                    profile.diagnosisHistory.map((item) => (
                      <div key={item.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.type === 'predict'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            }`}>
                              {item.type === 'predict' ? '🤖 Chẩn đoán AI' : '🔍 Tra cứu'}
                            </span>
                            <span className="font-bold text-slate-850 dark:text-slate-100 text-sm">{item.disease_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {item.input_symptoms && item.input_symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Triệu chứng:</span>
                            {item.input_symptoms.slice(0, 6).map((s, si) => (
                              <span key={si} className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-semibold">
                                {s}
                              </span>
                            ))}
                            {item.input_symptoms.length > 6 && (
                              <span className="text-[10px] text-slate-400">+{item.input_symptoms.length - 6} khác</span>
                            )}
                          </div>
                        )}
                        {item.query_text && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">🔎 {item.query_text}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Lịch sử hẹn khám */}
              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {profile.appointmentHistory.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                      <History className="h-10 w-10" />
                      <p className="text-sm font-bold">Bệnh nhân chưa có lịch sử hẹn khám</p>
                    </div>
                  ) : (
                    profile.appointmentHistory.map((appt) => {
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        pending: { label: 'Chờ xác nhận', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                        confirmed: { label: 'Đã xác nhận', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
                        completed: { label: 'Đã khám xong', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        cancelled: { label: 'Đã huỷ', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-450' },
                      };
                      const s = statusMap[appt.status] || { label: appt.status, cls: 'bg-slate-100 text-slate-500' };
                      return (
                        <div key={appt.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Ca #{appt.id}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${s.cls}`}>{s.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {new Date(appt.appointment_date).toLocaleDateString('vi-VN')} · {appt.appointment_time?.slice(0, 5)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-600 dark:text-slate-400">
                            {appt.Doctor && (
                              <div className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                <span>BS. {appt.Doctor.name} ({appt.Doctor.specialty})</span>
                              </div>
                            )}
                            {appt.Hospital && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{appt.Hospital.name}</span>
                              </div>
                            )}
                            {appt.Disease && (
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                <span>{appt.Disease.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Modal Kê đơn & Ghi chú kết quả khám
interface TreatmentModalProps {
  appointment: AppointmentItem;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface PrescriptionItem {
  name: string;
  qty: number;
  instruction: string;
  dosage: number;
}

function TreatmentModal({ appointment, onClose, onSaveSuccess }: TreatmentModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [resultNotes, setResultNotes] = useState(appointment.result_notes || "");
  
  // Quản lý đơn thuốc dạng bảng
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionItem[]>(() => {
    try {
      if (appointment.prescription && appointment.prescription.startsWith("[")) {
        const parsed = JSON.parse(appointment.prescription);
        return parsed.map((p: any) => ({
          name: p.name,
          qty: p.qty || 10,
          instruction: p.instruction || "Theo lời dặn của bác sĩ",
          dosage: p.dosage || 1
        }));
      }
    } catch (e) {
      console.warn("Lỗi parse đơn thuốc cũ:", e);
    }
    
    return [];
  });

  // Autocomplete thuốc
  const [medQuery, setMedQuery] = useState("");
  const [suggestedMeds, setSuggestedMeds] = useState<Array<{ name: string; unit: string; quantity: number; code?: string; default_instruction?: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingMeds, setSearchingMeds] = useState(false);

  // Tìm kiếm thuốc tự động từ DB khi bác sĩ gõ
  useEffect(() => {
    if (medQuery.trim().length < 1) {
      setSuggestedMeds([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingMeds(true);
      try {
        const res = await searchMedicines(medQuery);
        const list = res.data || res;
        setSuggestedMeds(list || []);
      } catch (err) {
        console.error("Lỗi search thuốc:", err);
      } finally {
        setSearchingMeds(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [medQuery]);

  const handleSelectMed = (med: any) => {
    if (med.quantity === 0) {
      toast.error("Thuốc này hiện đã hết hàng trong kho!");
      return;
    }
    
    // Kiểm tra xem thuốc đã có trong đơn chưa
    const isExist = prescriptionList.some(item => item.name === med.name);
    if (isExist) {
      toast.error("Thuốc này đã có trong đơn kê!");
      return;
    }

    const newItem: PrescriptionItem = {
      name: med.name,
      qty: 10,
      instruction: "Theo lời dặn của bác sĩ", // Đặt mặc định theo lời dặn của bác sĩ
      dosage: 1 // 1 viên cho 1 liều uống mặc định
    };

    setPrescriptionList(prev => [...prev, newItem]);
    setMedQuery("");
    setShowDropdown(false);
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    setPrescriptionList(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setPrescriptionList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultNotes.trim()) {
      toast.error("Vui lòng nhập chẩn đoán kết quả lâm sàng.");
      return;
    }

    setSaving(true);
    try {
      const serializedPrescription = JSON.stringify(prescriptionList);
      await updateTreatment(appointment.id, resultNotes, serializedPrescription);
      toast.success("Đã lưu chẩn đoán & kê đơn thành công! Trạng thái đã chuyển thành Khám xong.");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể cập nhật thông tin điều trị.");
    } finally {
      setSaving(false);
    }
  };

  // Hàm in đơn thuốc định dạng Bảng 4 Cột chuyên nghiệp
  const handlePrintPrescription = () => {
    const tableRows = prescriptionList.map((item, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>${item.name}</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.qty} viên</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.dosage} viên/lần</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${item.instruction}</td>
      </tr>
    `).join("");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Đơn thuốc y khoa</title>
            <style>
              body {
                font-family: "Times New Roman", Times, serif, Arial, sans-serif;
                color: #000000;
                background: #ffffff;
                margin: 0;
                padding: 30px;
                font-size: 14px;
                line-height: 1.5;
              }
              .print-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #000000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .print-title {
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                margin: 20px 0;
                text-transform: uppercase;
              }
              .print-info-grid {
                display: table;
                width: 100%;
                margin-bottom: 20px;
              }
              .print-info-row {
                display: table-row;
              }
              .print-info-cell {
                display: table-cell;
                padding: 5px 0;
                font-size: 14px;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              .print-table th, .print-table td {
                border: 1px solid #000000;
                padding: 8px;
                font-size: 13px;
              }
              .print-table th {
                background-color: #f2f2f2;
                text-align: left;
              }
              .print-footer {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                text-align: center;
                width: 220px;
              }
              .signature-title {
                font-style: italic;
                margin-bottom: 50px;
              }
              @media print {
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div>
                <h3 style="margin:0; font-size:16px; font-weight:bold;">HỆ THỐNG Y TẾ THÔNG MINH</h3>
                <p style="margin:3px 0 0 0; font-size:12px; color:#333;">Phòng khám đa khoa & Hỗ trợ chẩn đoán từ xa</p>
              </div>
              <div style="text-align: right;">
                <p style="margin:0; font-size:12px;">Mã ca khám: <strong>#${appointment.id}</strong></p>
                <p style="margin:3px 0 0 0; font-size:12px;">Ngày khám: ${new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            
            <div class="print-title">ĐƠN THUỐC Y KHOA</div>

            <div class="print-info-grid">
              <div class="print-info-row">
                <div class="print-info-cell" style="width: 50%;"><strong>Họ và tên bệnh nhân:</strong> ${appointment.User ? `${appointment.User.last_name} ${appointment.User.first_name}` : 'N/A'}</div>
                <div class="print-info-cell" style="width: 50%;"><strong>Số điện thoại:</strong> ${appointment.User?.phone || 'N/A'}</div>
              </div>
              <div class="print-info-row">
                <div class="print-info-cell" colspan="2" style="padding-top: 8px;"><strong>Chẩn đoán lâm sàng:</strong> ${resultNotes}</div>
              </div>
            </div>

            <h4 style="font-size:14px; font-weight:bold; margin-bottom:5px; margin-top: 20px;">Chỉ định điều trị & Đơn thuốc:</h4>
            <table class="print-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">STT</th>
                  <th>Tên dược phẩm</th>
                  <th style="width: 90px; text-align: center;">Số lượng phát</th>
                  <th style="width: 100px; text-align: center;">Liều lượng/lần</th>
                  <th>Hướng dẫn cách dùng</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || `<tr><td colspan="5" style="padding:15px; text-align:center; color:#555;">Không có thuốc được chỉ định. Nghỉ ngơi và theo dõi thêm.</td></tr>`}
              </tbody>
            </table>

            <div class="print-footer">
              <div>
                <p style="margin:0; font-size:11px; color:#555;">* Lưu ý: Uống thuốc đúng liều lượng và thời gian chỉ định.</p>
                <p style="margin:3px 0 0 0; font-size:11px; color:#555;">* Tái khám nếu triệu chứng không thuyên giảm.</p>
              </div>
              <div class="signature-box">
                <p style="margin:0; font-size:13px; font-weight:bold;">Bác sĩ điều trị</p>
                <p class="signature-title">(Ký và ghi rõ họ tên)</p>
                <p style="margin-top:50px; font-size:14px; font-weight:bold;">BS. ${appointment.Doctor?.name || 'Bác sĩ điều trị'}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();
    }

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100">Kê đơn & Chẩn đoán ca #{appointment.id}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Bệnh nhân</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                {appointment.User ? `${appointment.User.last_name} ${appointment.User.first_name}` : "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Điện thoại</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                {appointment.User?.phone || "N/A"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kết luận / Chẩn đoán lâm sàng *</label>
            <textarea
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="VD: Cúm A biến chứng nhẹ, cần nghỉ ngơi và uống nhiều nước."
              rows={2}
              className="w-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-850 px-4 py-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Tìm kiếm thuốc Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kê đơn: Nhập 1-2 chữ để chọn dược phẩm từ kho (FDA) 🔎</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ví dụ: Lisinopril, Ibuprofen, Paracetamol..."
                value={medQuery}
                onChange={(e) => {
                  setMedQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-850 pl-9 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {searchingMeds && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Dropdown kết quả gợi ý */}
            {showDropdown && medQuery.trim() !== "" && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
                {suggestedMeds.length === 0 ? (
                  <div className="p-3 text-xs text-slate-450 text-center font-bold">Không tìm thấy dược phẩm nào</div>
                ) : (
                  suggestedMeds.map((med, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectMed(med)}
                      className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center text-xs font-semibold"
                    >
                      <div className="space-y-0.5">
                        <p className="text-slate-800 dark:text-slate-200 font-bold">{med.name}</p>
                        {med.code && <p className="text-[9px] text-slate-400">Mã NDC: {med.code}</p>}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        med.quantity === 0 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {med.quantity === 0 ? "Hết" : `Kho: ${med.quantity}`}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* BẢNG ĐƠN THUỐC 3 CỘT (Tên thuốc, Số lượng, Hướng dẫn sử dụng) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Chi tiết đơn thuốc đã kê</label>
            {prescriptionList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 font-bold">
                Chưa có thuốc nào trong đơn. Hãy chọn thuốc ở ô tìm kiếm phía trên.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-450 uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">Tên dược phẩm</th>
                      <th className="py-2.5 px-3 w-28">Số lượng phát</th>
                      <th className="py-2.5 px-3 w-28">Liều lượng</th>
                      <th className="py-2.5 px-3">Cách dùng / Tần suất</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {prescriptionList.map((item, idx) => (
                      <tr key={idx} className="bg-white dark:bg-slate-900">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-250 truncate max-w-[150px]" title={item.name}>
                          {item.name}
                        </td>
                        <td className="py-2 px-2 flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(idx, 'qty', Number(e.target.value))}
                            className="w-12 border border-slate-200 dark:border-slate-700 bg-transparent rounded px-1.5 py-1 text-center font-bold text-xs"
                          />
                          <span className="text-[10px] text-slate-450 font-bold">viên</span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0.25}
                              max={10}
                              step={0.25}
                              value={item.dosage}
                              onChange={(e) => handleUpdateItem(idx, 'dosage', Number(e.target.value))}
                              className="w-12 border border-slate-200 dark:border-slate-700 bg-transparent rounded px-1.5 py-1 text-center font-bold text-xs"
                            />
                            <span className="text-[10px] text-slate-450 font-bold">viên/lần</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 space-y-1">
                          {(() => {
                            const standardOptions = [
                              "2 lần/ngày",
                              "3 lần/ngày",
                              "1 lần/ngày (sáng)",
                              "1 lần/ngày (tối)",
                              "2 ngày 1 lần",
                              "Theo lời dặn của bác sĩ"
                            ];
                            const isCustom = !standardOptions.includes(item.instruction);
                            return (
                              <div className="flex flex-col gap-1">
                                <select
                                  value={isCustom ? "custom" : item.instruction}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      handleUpdateItem(idx, 'instruction', "");
                                    } else {
                                      handleUpdateItem(idx, 'instruction', val);
                                    }
                                  }}
                                  className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded px-1.5 py-1 text-xs"
                                >
                                  {standardOptions.map((opt, oi) => (
                                    <option key={oi} value={opt} className="bg-white dark:bg-slate-900">{opt}</option>
                                  ))}
                                  <option value="custom" className="bg-white dark:bg-slate-900 font-bold">Tự nhập...</option>
                                </select>
                                {isCustom && (
                                  <input
                                    type="text"
                                    value={item.instruction}
                                    onChange={(e) => handleUpdateItem(idx, 'instruction', e.target.value)}
                                    placeholder="Nhập hướng dẫn riêng..."
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded px-2 py-1 text-xs"
                                    autoFocus
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-500/10"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chân form */}
          <div className="flex gap-2 justify-between pt-2 border-t border-slate-150 dark:border-slate-800 shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={handlePrintPrescription}
              disabled={prescriptionList.length === 0}
              className="border-primary text-primary hover:bg-primary/5 font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In đơn thuốc (Bản PDF)</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Hủy</Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold" disabled={saving}>
                {saving ? "Đang lưu..." : "Xác nhận & Hoàn thành"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


// Render Lịch tháng dạng Grid CSS (Calendar View)
interface CalendarViewProps {
  appointments: AppointmentItem[];
  onSelectAppointment: (id: number, name: string) => void;
  onOpenTreatment: (appt: AppointmentItem) => void;
  onUpdateStatus: (id: number, status: 'confirmed' | 'cancelled') => void;
}

function CalendarView({ appointments, onSelectAppointment, onOpenTreatment, onUpdateStatus }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = startOfMonth.getDay(); // 0: Chủ nhật, 1: Thứ 2
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  // Điền ngày trống của tháng trước
  for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
    days.push(null);
  }
  // Điền ngày của tháng này
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Đổi tháng
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getAppointmentsForDate = (date: Date) => {
    const formattedStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return appointments.filter(a => a.appointment_date === formattedStr);
  };

  return (
    <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100 uppercase tracking-wide">
          Tháng {month + 1} / {year}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/10 min-h-[90px] rounded-lg border border-transparent" />;
          
          const appts = getAppointmentsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={date.toISOString()}
              className={`min-h-[90px] p-1.5 rounded-lg border text-left flex flex-col justify-between ${
                isToday 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                  : 'border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900/30'
              }`}
            >
              <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? 'bg-primary text-white' : 'text-slate-400'
              }`}>
                {date.getDate()}
              </span>

              <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[70px]">
                {appts.slice(0, 3).map(a => {
                  const patientName = a.User ? `${a.User.last_name} ${a.User.first_name}` : "K/Rõ";
                  let bgStyle = 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                  if (a.status === 'confirmed') bgStyle = 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400';
                  if (a.status === 'completed') bgStyle = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
                  if (a.status === 'cancelled') bgStyle = 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450';
                  
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelectAppointment(a.User?.id || 0, patientName)}
                      className={`w-full block text-left text-[9px] px-1 py-0.5 rounded font-bold truncate ${bgStyle}`}
                      title={`${a.appointment_time.slice(0, 5)} - ${patientName}`}
                    >
                      {a.appointment_time.slice(0, 5)} {patientName}
                    </button>
                  );
                })}
                {appts.length > 3 && (
                  <div className="text-[8px] font-bold text-slate-400 text-center">+{appts.length - 3} ca khác</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function DoctorDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<{ userId: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients' | 'stats' | 'profile'>('appointments');
  const [subTab, setSubTab] = useState<'list' | 'calendar'>('list');
  
  // States cho các tính năng tìm kiếm, kê đơn thuốc và quản lý profile
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTreatment, setEditingTreatment] = useState<AppointmentItem | null>(null);
  
  const [docProfile, setDocProfile] = useState<DoctorProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFee, setFormFee] = useState(150000);
  const [formExp, setFormExp] = useState(5);
  const [formBio, setFormBio] = useState("");

  async function loadAppointments() {
    setLoading(true);
    try {
      const res = await getDoctorAppointments();
      setAppointments(res.data || res || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải danh sách lịch khám của bác sĩ.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctorProfileData() {
    setLoadingProfile(true);
    try {
      const res = await getDoctorProfile();
      const data = res.data || res;
      setDocProfile(data);
      setFormSpecialty(data.specialty || "");
      setFormPhone(data.phone || "");
      setFormFee(Number(data.fee) || 150000);
      setFormExp(data.experience_years || 5);
      setFormBio(data.bio || "");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadAppointments();
    loadDoctorProfileData();
  }, []);

  const handleUpdateStatus = async (appointmentId: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    setActionLoading(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, status);
      toast.success(
        status === "confirmed"
          ? "Đã xác nhận lịch khám!"
          : status === "completed"
          ? "Đã hoàn thành ca khám!"
          : "Đã huỷ lịch hẹn khám!"
      );
      await loadAppointments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateDoctorProfile({
        specialty: formSpecialty,
        phone: formPhone,
        experience_years: formExp,
        fee: formFee,
        bio: formBio
      });
      toast.success("Đã cập nhật hồ sơ bác sĩ thành công!");
      await loadDoctorProfileData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể cập nhật hồ sơ bác sĩ.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Tính toán số liệu thống kê nhanh
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    revenue: appointments.filter(a => a.status === 'completed' && a.payment_type !== 'insurance').reduce((acc, _curr) => acc + Number(docProfile?.fee ?? 150000), 0)
  };

  // Lọc lịch hẹn
  const filteredAppointments = appointments.filter(item => {
    const statusMatch = filter === "all" ? true : item.status === filter;
    
    // Tìm kiếm (Số 12): Tên, Số điện thoại bệnh nhân, hoặc Chẩn đoán bệnh
    const patientName = item.User ? `${item.User.last_name} ${item.User.first_name}`.toLowerCase() : "";
    const phone = item.User?.phone?.toLowerCase() || "";
    const disease = item.Disease?.name?.toLowerCase() || "";
    const notes = item.notes?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    const searchMatch = searchQuery === "" ? true : (
      patientName.includes(query) || 
      phone.includes(query) || 
      disease.includes(query) || 
      notes.includes(query)
    );

    return statusMatch && searchMatch;
  });

  // Tính toán danh sách bệnh nhân duy nhất (Số 11)
  const uniquePatientsMap = new Map<number, { id: number; name: string; phone: string; email: string; totalAppointments: number; lastVisit: string }>();
  let unknownPatientCount = 0;
  appointments.forEach(appt => {
    if (appt.User?.id) {
      const existing = uniquePatientsMap.get(appt.User.id);
      if (existing) {
        existing.totalAppointments++;
        if (new Date(appt.appointment_date) > new Date(existing.lastVisit)) {
          existing.lastVisit = appt.appointment_date;
        }
      } else {
        uniquePatientsMap.set(appt.User.id, {
          id: appt.User.id,
          name: `${appt.User.last_name} ${appt.User.first_name}`,
          phone: appt.User.phone || "N/A",
          email: appt.User.email || "N/A",
          totalAppointments: 1,
          lastVisit: appt.appointment_date
        });
      }
    } else {
      unknownPatientCount++;
    }
  });
  if (unknownPatientCount > 0) {
    uniquePatientsMap.set(-1, {
      id: -1,
      name: `Bệnh nhân chưa rõ (${unknownPatientCount} ca)`,
      phone: "N/A",
      email: "N/A",
      totalAppointments: unknownPatientCount,
      lastVisit: appointments.filter(a => !a.User?.id).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]?.appointment_date || new Date().toISOString().split("T")[0]
    });
  }
  const uniquePatientsList = Array.from(uniquePatientsMap.values()).filter(p => 
    searchQuery === "" ? true : p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery)
  );

  const getStatusLabel = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-lg">Đã xác nhận</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-xs font-bold rounded-lg">Đã khám xong</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-lg">Đã huỷ</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg animate-pulse">Chờ xác nhận</span>;
    }
  };

  // Xuất file báo cáo lịch hẹn CSV (Số 8)
  const handleExportCSV = () => {
    try {
      let csvContent = "\uFEFFid,ngay_hen,gio_hen,trang_thai,ten_benh_nhan,dien_thoai,hinh_thuc_thanh_toan,ghi_chu_chuan_doan\n";
      filteredAppointments.forEach(appt => {
        const name = appt.User ? `${appt.User.last_name} ${appt.User.first_name}` : "K/Rõ";
        const phone = appt.User?.phone || "";
        const row = [
          appt.id,
          appt.appointment_date,
          appt.appointment_time,
          appt.status,
          `"${name}"`,
          phone,
          appt.payment_type === 'insurance' ? 'BHYT' : 'Dich vu',
          `"${appt.result_notes || ''}"`
        ].join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bao_cao_lich_hen_BS_${new Date().toLocaleDateString('vi-VN')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã xuất tệp CSV báo cáo thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Xuất báo cáo thất bại.");
    }
  };

  // In danh sách ra PDF/Giấy in (Số 8)
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal hồ sơ bệnh nhân */}
      {selectedPatient && (
        <PatientHealthModal
          userId={selectedPatient.userId}
          patientName={selectedPatient.name}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Modal Kê đơn / Chẩn đoán khi khám xong */}
      {editingTreatment && (
        <TreatmentModal
          appointment={editingTreatment}
          onClose={() => setEditingTreatment(null)}
          onSaveSuccess={loadAppointments}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Banner tiêu đề chính */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Hệ thống Y tế thông minh</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Bác sĩ: {docProfile?.name || "Đang tải..."}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chuyên khoa: <span className="font-bold text-primary">{docProfile?.specialty || "—"}</span> · Bệnh viện: {docProfile?.Hospital?.name || "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadAppointments} variant="outline" className="text-xs font-bold flex items-center gap-1.5 self-start md:self-center">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation chính */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1">
          {[
            { id: 'appointments', label: 'Lịch làm việc', icon: <CalendarIcon className="h-4 w-4" /> },
            { id: 'patients', label: 'Danh sách bệnh nhân', icon: <Users className="h-4 w-4" /> },
            { id: 'stats', label: 'Báo cáo & Thống kê', icon: <BarChart2 className="h-4 w-4" /> },
            { id: 'profile', label: 'Hồ sơ cá nhân', icon: <Settings className="h-4 w-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* NỘI DUNG THEO TỪNG TAB */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            
            {/* Thống kê nhanh */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tổng số ca hẹn", val: stats.total, color: "text-slate-800 dark:text-slate-100 bg-slate-500/10" },
                { label: "Chờ xác nhận", val: stats.pending, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
                { label: "Đã xác nhận", val: stats.confirmed, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
                { label: "Đã khám xong", val: stats.completed, color: "text-emerald-600 dark:text-emerald-450 bg-emerald-500/10" },
              ].map((s, i) => (
                <Card key={i} className="p-4 flex flex-col justify-between space-y-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                  <span className="text-xs font-bold text-slate-400">{s.label}</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-850 dark:text-slate-50">{s.val}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s.color}`}>Ca</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tìm kiếm và Chuyển chế độ xem */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm lịch hẹn theo tên bệnh nhân, số điện thoại hoặc chẩn đoán..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-end sm:self-center gap-1 shrink-0">
                <button
                  onClick={() => setSubTab('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subTab === 'list' ? 'bg-white dark:bg-slate-900 text-primary shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Danh sách
                </button>
                <button
                  onClick={() => setSubTab('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    subTab === 'calendar' ? 'bg-white dark:bg-slate-900 text-primary shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Lịch biểu
                </button>
              </div>
            </div>

            {/* Chế độ xem Lịch Biểu Calendar */}
            {subTab === 'calendar' ? (
              <CalendarView
                appointments={appointments}
                onSelectAppointment={(id, name) => setSelectedPatient({ userId: id, name })}
                onOpenTreatment={(appt) => setEditingTreatment(appt)}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              // Chế độ xem danh sách (List View)
              <div className="space-y-4">
                {/* Bộ lọc trạng thái có Badge thông báo chờ duyệt (Số 4) */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl gap-1 overflow-x-auto">
                  {[
                    { id: "all", label: "Tất cả", badge: 0 },
                    { id: "pending", label: "Chờ duyệt", badge: stats.pending },
                    { id: "confirmed", label: "Đã duyệt", badge: 0 },
                    { id: "completed", label: "Đã khám", badge: 0 },
                    { id: "cancelled", label: "Đã huỷ", badge: 0 },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`relative shrink-0 py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                        filter === tab.id
                          ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Danh sách thẻ lịch hẹn */}
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(n => (
                      <Card key={n} className="p-6 space-y-3">
                        <Skeleton className="h-6 w-1/4 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                      </Card>
                    ))}
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <EmptyState
                    title="Không có lịch hẹn"
                    description="Không có ca hẹn khám nào phù hợp với bộ lọc tìm kiếm hiện tại."
                    icon={<Inbox className="h-10 w-10 text-slate-350" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map(item => {
                      const displayTime = `${item.appointment_time.slice(0, 5)} - Ngày ${item.appointment_date.split("-").reverse().join("/")}`;
                      
                      let cleanNotes = item.notes || "";
                      let diseaseName = "";
                      const match = cleanNotes.match(/^\[Bệnh lý:\s*([^\]]+)\]\s*(.*)/);
                      if (match) {
                        diseaseName = match[1];
                        cleanNotes = match[2];
                      } else if (item.Disease?.name) {
                        diseaseName = item.Disease.name;
                      }

                      const patientName = item.User ? `${item.User.last_name} ${item.User.first_name}` : "Không rõ";

                      return (
                        <Card
                          key={item.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                          {/* Row bệnh nhân */}
                          {item.User?.id ? (
                            <button
                              onClick={() => setSelectedPatient({ userId: item.User!.id, name: patientName })}
                              className="w-full flex items-center justify-between px-5 pt-4 pb-2 hover:bg-primary/5 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs text-slate-400 font-semibold">Bấm xem chi tiết hồ sơ sức khỏe</p>
                                  <p className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-tight">{patientName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold">Xem hồ sơ</span>
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full flex items-center px-5 pt-4 pb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <User className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs text-slate-400 font-semibold">Không có thông tin bệnh nhân</p>
                                  <p className="font-extrabold text-slate-500 dark:text-slate-400 text-sm leading-tight">{patientName}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="p-5 pt-2 space-y-4 flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
                                  Ca khám #{item.id}
                                </span>
                                {getStatusLabel(item.status)}
                                {item.payment_type === 'insurance' ? (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-black">
                                    BHYT {item.insurance_card_number && `(${item.insurance_card_number})`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-black">
                                    Khám Dịch vụ ⭐
                                  </span>
                                )}
                                {diseaseName && (
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                                    Bệnh lý: {diseaseName}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex gap-2 items-center text-slate-700 dark:text-slate-300 font-semibold">
                                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span>Giờ hẹn: <span className="font-extrabold text-slate-850 dark:text-slate-550">{displayTime}</span></span>
                                </div>

                                <div className="flex gap-2 items-center text-slate-700 dark:text-slate-300 font-semibold">
                                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span>Điện thoại: <span className="font-extrabold text-slate-850 dark:text-slate-550">{item.User?.phone || "Không cung cấp"}</span></span>
                                </div>

                                {cleanNotes && (
                                  <div className="flex gap-2 items-start text-slate-700 dark:text-slate-300 font-semibold md:col-span-2">
                                    <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span>Lý do đặt lịch: <span className="font-medium text-slate-500">{cleanNotes}</span></span>
                                  </div>
                                )}

                                {/* Hiển thị chẩn đoán thuốc cũ nếu có */}
                                {item.status === 'completed' && (item.result_notes || item.prescription) && (
                                  <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">🩺 Kết luận chẩn đoán & Đơn thuốc đã kê:</p>
                                    {item.result_notes && <p><span className="font-semibold text-slate-400">Chẩn đoán:</span> {item.result_notes}</p>}
                                    {item.prescription && <p><span className="font-semibold text-slate-400">Đơn thuốc:</span> <span className="whitespace-pre-line font-mono text-[11px] bg-white dark:bg-slate-900 px-2 py-1 rounded inline-block w-full border border-slate-200 dark:border-slate-700">{item.prescription}</span></p>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Nút thao tác của bác sĩ (Gồm Kê đơn sau khám - Số 1) */}
                            <div className="shrink-0 flex md:flex-col justify-end gap-2 items-stretch self-stretch md:self-center min-w-[140px]">
                              {item.status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleUpdateStatus(item.id, 'confirmed')}
                                    disabled={actionLoading === item.id}
                                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>Duyệt lịch hẹn</span>
                                  </Button>
                                  <Button
                                    onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                                    disabled={actionLoading === item.id}
                                    variant="outline"
                                    className="border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-400 font-bold text-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Hủy lịch</span>
                                  </Button>
                                </>
                              )}
                              
                              {item.status === 'confirmed' && (
                                <>
                                  {/* Bấm vào đây để mở modal kê đơn & kết luận lâm sàng (Tính năng số 1) */}
                                  <Button
                                    onClick={() => setEditingTreatment(item)}
                                    disabled={actionLoading === item.id}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all shadow-xs"
                                  >
                                    <Stethoscope className="h-3.5 w-3.5" />
                                    <span>Khám xong & Kê đơn</span>
                                  </Button>
                                  <Button
                                    onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                                    disabled={actionLoading === item.id}
                                    variant="outline"
                                    className="border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-400 font-bold text-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Hủy lịch</span>
                                  </Button>
                                </>
                              )}

                              {(item.status === 'completed' || item.status === 'cancelled') && (
                                <div className="text-center space-y-1.5">
                                  <span className="text-xs text-slate-400 font-extrabold italic block">
                                    Lịch sử đã đóng
                                  </span>
                                  {item.status === 'completed' && (
                                    <button 
                                      onClick={() => setEditingTreatment(item)}
                                      className="text-[10px] text-primary hover:underline font-bold"
                                    >
                                      Chỉnh sửa đơn thuốc
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DANH SÁCH BỆNH NHÂN RIÊNG (Số 11) */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bệnh nhân theo họ tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {uniquePatientsList.length === 0 ? (
              <EmptyState
                title="Không tìm thấy bệnh nhân"
                description="Bạn chưa khám cho bệnh nhân nào hoặc tìm kiếm không khớp."
                icon={<Users className="h-10 w-10 text-slate-350" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniquePatientsList.map(p => (
                  <Card key={p.id} className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-snug">{p.name}</h4>
                          <p className="text-xs text-slate-450">{p.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                        {p.totalAppointments} ca khám
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-450 space-y-1">
                      <p>📧 Email: <span className="font-medium text-slate-700 dark:text-slate-300">{p.email}</span></p>
                      <p>📅 Ngày khám gần nhất: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.lastVisit.split("-").reverse().join("/")}</span></p>
                    </div>

                    <button
                      onClick={() => p.id !== -1 && setSelectedPatient({ userId: p.id, name: p.name })}
                      disabled={p.id === -1}
                      className={`w-full mt-2 text-center text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                        p.id === -1
                          ? "text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                          : "text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>{p.id === -1 ? "Không có hồ sơ bệnh án" : "Xem đầy đủ hồ sơ bệnh án"}</span>
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BÁO CÁO & THỐNG KÊ BIỂU ĐỒ (Số 5 & 8) */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            
            {/* Hộp Thống kê Nhanh Doanh Thu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doanh thu tạm tính</p>
                  <h4 className="text-xl font-black text-slate-850 dark:text-slate-50">
                    {stats.revenue.toLocaleString('vi-VN')} đ
                  </h4>
                  <p className="text-[9px] text-slate-400">Số ca đã khám xong × Phí dịch vụ</p>
                </div>
              </Card>

              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-6 w-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hiệu suất khám bệnh</p>
                  <h4 className="text-xl font-black text-slate-850 dark:text-slate-50">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </h4>
                  <p className="text-[9px] text-slate-450">{stats.completed} ca đã khám / {stats.total} ca tổng cộng</p>
                </div>
              </Card>

              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Heart className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tài khoản bệnh nhân</p>
                  <h4 className="text-xl font-black text-slate-850 dark:text-slate-50">
                    {uniquePatientsList.length}
                  </h4>
                  <p className="text-[9px] text-slate-450">Bệnh nhân liên kết khám</p>
                </div>
              </Card>
            </div>

            {/* Khung Biểu Đồ SVG Tự vẽ Trực quan (Số 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Biểu đồ 1: Số ca theo trạng thái */}
              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-4">Trực quan hóa trạng thái ca hẹn</h4>
                <div className="flex justify-center items-center h-48">
                  {/* SVG Donut chart đơn giản */}
                  <svg width="160" height="160" viewBox="0 0 36 36" className="shrink-0">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    {stats.total > 0 && (
                      <>
                        {/* Completed (Emerald) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          strokeDasharray={`${(stats.completed / stats.total) * 100} ${100 - (stats.completed / stats.total) * 100}`}
                          strokeDashoffset="25"
                        />
                        {/* Confirmed (Sky) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="3.5"
                          strokeDasharray={`${(stats.confirmed / stats.total) * 100} ${100 - (stats.confirmed / stats.total) * 100}`}
                          strokeDashoffset={25 - ((stats.completed / stats.total) * 100)}
                        />
                      </>
                    )}
                  </svg>
                  
                  {/* Chú giải thông tin bên cạnh */}
                  <div className="ml-6 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Đã khám xong ({stats.completed})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Đã duyệt ({stats.confirmed})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Chờ xác nhận ({stats.pending})</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Biểu đồ 2: Cơ cấu bệnh nhân (BHYT vs Dịch vụ) */}
              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-4">Cơ cấu loại hình bệnh nhân</h4>
                {(() => {
                  const ins = appointments.filter(a => a.payment_type === 'insurance').length;
                  const serv = appointments.length - ins;
                  const insPercent = appointments.length > 0 ? Math.round((ins / appointments.length) * 100) : 50;
                  const servPercent = 100 - insPercent;

                  return (
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-emerald-500">Khám Dịch vụ ⭐ ({serv} ca)</span>
                          <span className="text-amber-500">Bảo hiểm BHYT 🏥 ({ins} ca)</span>
                        </div>
                        {/* Thanh progress bar phân chia tỉ lệ */}
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${servPercent}%` }} className="bg-gradient-to-r from-emerald-400 to-emerald-500" />
                          <div style={{ width: `${insPercent}%` }} className="bg-gradient-to-r from-amber-400 to-amber-500" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-emerald-500/5 p-3 rounded-xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Tỉ lệ ca dịch vụ</p>
                          <p className="text-xl font-extrabold text-emerald-600">{servPercent}%</p>
                        </div>
                        <div className="bg-amber-500/5 p-3 rounded-xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Tỉ lệ ca BHYT</p>
                          <p className="text-xl font-extrabold text-amber-600">{insPercent}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>

            {/* Tính năng xuất báo cáo và in danh sách lịch hẹn (Số 8) */}
            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm">Xuất báo cáo ca khám lâm sàng</h4>
                  <p className="text-xs text-slate-400 mt-1">Xuất dữ liệu lịch hẹn hiện tại ra tệp CSV để lưu trữ hoặc in danh sách lịch hẹn trong ngày.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportCSV} className="bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Xuất báo cáo Excel (CSV)</span>
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="text-xs font-bold flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Printer className="h-4 w-4 text-slate-500" />
                    <span>In bảng danh sách</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: HỒ SƠ BÁC SĨ (Số 3) */}
        {activeTab === 'profile' && (
          <Card className="p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-150 dark:border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-850 dark:text-slate-100">Quản lý Hồ sơ của tôi</h3>
                <p className="text-xs text-slate-400">Xem và sửa đổi thông tin hiển thị với bệnh nhân trên trang đặt lịch.</p>
              </div>
            </div>

            {loadingProfile ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Tên bác sĩ (Liên kết hệ thống)</label>
                    <input
                      type="text"
                      value={docProfile?.name || ""}
                      disabled
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Bệnh viện / Cơ sở y tế</label>
                    <input
                      type="text"
                      value={docProfile?.Hospital?.name || ""}
                      disabled
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Chuyên khoa khám bệnh</label>
                    <input
                      type="text"
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="Ví dụ: Khoa Nội, Tai Mũi Họng, Nhi Khoa"
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Số điện thoại di động hoặc bàn"
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Số năm kinh nghiệm</label>
                    <input
                      type="number"
                      value={formExp}
                      onChange={(e) => setFormExp(Number(e.target.value))}
                      min={0}
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Phí khám cơ bản (VNĐ) ⭐</label>
                    <input
                      type="number"
                      value={formFee}
                      onChange={(e) => setFormFee(Number(e.target.value))}
                      min={0}
                      step={10000}
                      className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tiểu sử nghề nghiệp / Mô tả bản thân</label>
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Mô tả quá trình đào tạo học tập, chứng chỉ và các dịch vụ khám chữa bệnh cung cấp..."
                    rows={4}
                    className="w-full text-sm font-medium border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={updatingProfile} className="bg-primary hover:bg-primary-dark text-white font-bold">
                    {updatingProfile ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
