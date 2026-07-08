import React, { useEffect, useState } from "react";
import { getDoctorAppointments, updateAppointmentStatus, getPatientHealthProfile } from "../api/appointment";
import { useToast } from "../context/ToastContext";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import {
  Calendar,
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
  X,
  Stethoscope,
  ClipboardList,
  History,
  AlertCircle,
  Info
} from "lucide-react";

interface AppointmentItem {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  payment_type?: 'service' | 'insurance';
  insurance_card_number?: string;
  User?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  Hospital?: {
    name: string;
    address: string;
  };
  Disease?: {
    name: string;
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
  const age = now.getFullYear() - birth.getFullYear();
  return `${age} tuổi`;
}

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
            { id: 'appointments', label: 'Lịch sử hẹn khám', icon: <Calendar className="h-3.5 w-3.5" /> },
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
                        { icon: <Calendar className="h-4 w-4 text-sky-500/70" />, label: "Ngày sinh", value: profile.patient.date_of_birth ? new Date(profile.patient.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật' },
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
                    profile.diagnosisHistory.map((item, i) => (
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
                        cancelled: { label: 'Đã huỷ', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
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

export default function DoctorDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<{ userId: number; name: string } | null>(null);

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

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    setActionLoading(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, status);
      toast.success(
        status === "confirmed"
          ? "Đã xác nhận lịch khám!"
          : status === "completed"
          ? "Đã đánh dấu hoàn thành ca khám!"
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

  // Tính toán số liệu thống kê
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const filteredAppointments = appointments.filter(item => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const getStatusLabel = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-lg">Đã xác nhận</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">Đã khám xong</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-lg">Đã huỷ</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg animate-pulse">Chờ xác nhận</span>;
    }
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

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Trang quản trị Bác sĩ</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Quản lý lịch hẹn khám
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Xem, tiếp nhận và xác nhận các yêu cầu lịch khám trực tuyến từ bệnh nhân.
            </p>
          </div>
          <Button onClick={loadAppointments} variant="outline" className="text-xs font-bold flex items-center gap-1.5 self-start md:self-center">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Tải lại</span>
          </Button>
        </div>

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

        {/* Bộ lọc tab */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt" },
            { id: "confirmed", label: "Đã duyệt" },
            { id: "completed", label: "Đã khám" },
            { id: "cancelled", label: "Đã huỷ" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                filter === tab.id
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách lịch hẹn */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <Card key={n} className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </Card>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            title="Không có lịch hẹn"
            description="Hiện tại không có yêu cầu hẹn khám nào trong mục này."
            icon={<Inbox className="h-10 w-10 text-slate-350" />}
          />
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(item => {
              const displayTime = `${item.appointment_time.slice(0, 5)} - Ngày ${item.appointment_date.split("-").reverse().join("/")}`;
              
              // Bóc tách tên bệnh
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
                  {/* Clickable patient row to view full health profile */}
                  {item.User?.id && (
                    <button
                      onClick={() => setSelectedPatient({ userId: item.User!.id, name: patientName })}
                      className="w-full flex items-center justify-between px-5 pt-4 pb-2 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-400 font-semibold">Bấm để xem hồ sơ sức khỏe</p>
                          <p className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-tight">{patientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold">Xem hồ sơ</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  )}

                  <div className="p-5 pt-2 space-y-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      {/* Header lịch hẹn */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
                          Ca khám #{item.id}
                        </span>
                        {getStatusLabel(item.status)}
                        {item.payment_type === 'insurance' ? (
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-black animate-pulse">
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

                      {/* Thông tin chi tiết */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex gap-2 items-center text-slate-700 dark:text-slate-300 font-semibold">
                          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>Giờ hẹn: <span className="font-extrabold text-slate-850 dark:text-slate-50">{displayTime}</span></span>
                        </div>

                        <div className="flex gap-2 items-center text-slate-700 dark:text-slate-300 font-semibold">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>Điện thoại: <span className="font-extrabold text-slate-850 dark:text-slate-50">{item.User?.phone || "Không cung cấp"}</span></span>
                        </div>

                        {cleanNotes && (
                          <div className="flex gap-2 items-start text-slate-700 dark:text-slate-300 font-semibold">
                            <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">Ghi chú/Lý do: <span className="font-medium text-slate-500">{cleanNotes}</span></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Các nút thao tác của bác sĩ */}
                    <div className="shrink-0 flex md:flex-col justify-end gap-2 items-stretch self-stretch md:self-center">
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
                          <Button
                            onClick={() => handleUpdateStatus(item.id, 'completed')}
                            disabled={actionLoading === item.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Khám xong</span>
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
                        <span className="text-xs text-slate-400 font-extrabold italic text-center py-2">
                          Lịch sử đã đóng
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
