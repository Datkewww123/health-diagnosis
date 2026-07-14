import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Stethoscope, Building2, Pill, BrainCircuit, LogOut, 
  Plus, RefreshCw, MapPin, Activity, Calendar, Search
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { postRequest, getRequest, putRequest, deleteRequest } from "../api/client";

// Định nghĩa giao diện các thực thể
interface DoctorItem {
  id: number;
  specialty: string;
  experience_years: number;
  User?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    username: string;
  };
  Hospital?: {
    name: string;
  };
}

interface HospitalItem {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
}

interface MedicineItem {
  id: number;
  name: string;
  code: string;
  unit: string;
  quantity: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'hospitals' | 'medicines' | 'ai'>('overview');

  // States dữ liệu
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [docPage, setDocPage] = useState(1);
  const [docTotalPages, setDocTotalPages] = useState(1);
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [medPage, setMedPage] = useState(1);
  const [medTotalPages, setMedTotalPages] = useState(1);
  const [medTotal, setMedTotal] = useState(0);
  const [medSearch, setMedSearch] = useState("");
  const MED_PAGE_SIZE = 15;
  const [syncingAI, setSyncingAI] = useState(false);
  const [syncingHospitals, setSyncingHospitals] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appTotal, setAppTotal] = useState(0);
  const [appFilterMonth, setAppFilterMonth] = useState("");
  const currentYear = new Date().getFullYear();
  const [appFilterYear, setAppFilterYear] = useState(String(currentYear));
  const [appFilterDay, setAppFilterDay] = useState("");
  const [appFilterStatus, setAppFilterStatus] = useState("");
  const APP_PAGE_SIZE = 10;
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showAppDetailModal, setShowAppDetailModal] = useState(false);
  const [diseaseInput, setDiseaseInput] = useState("");

  // States loading
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingMeds, setLoadingMeds] = useState(false);

  // States Form Thêm mới
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    first_name: "", last_name: "", username: "", email: "", phone: "", password: "", specialty: "Đa khoa", hospital_id: ""
  });
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);

  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: "", address: "", phone: "", email: "", description: ""
  });
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingHospitalId, setEditingHospitalId] = useState<number | null>(null);

  // Stats state
  const [stats, setStats] = useState({ doctors: 0, hospitals: 0, medicines: 0 });

  // Load danh sách dữ liệu
  const fetchAppointments = async (page: number, month?: string, year?: string, day?: string, status?: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(APP_PAGE_SIZE) });
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (day) params.append("day", day);
      if (status && status !== "all") params.append("status", status);
      const data = await getRequest(`/api/admin/appointments?${params.toString()}`);
      setAppointments(data.appointments || []);
      setAppPage(data.page || page);
      setAppTotalPages(data.totalPages || 1);
      setAppTotal(data.total || 0);
    } catch (e) {
      toast.error("Không thể lấy danh sách lịch hẹn");
    }
  };

  const fetchDoctors = async (page = 1) => {
    setLoadingDocs(true);
    try {
      const data = await getRequest(`/api/admin/doctors?page=${page}&limit=15`);
      setDoctors(data.doctors || []);
      setDocPage(data.page || 1);
      setDocTotalPages(data.totalPages || 1);
    } catch (e) {
      toast.error("Không thể lấy danh sách bác sĩ");
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const data = await getRequest("/api/admin/hospitals");
      setHospitals(data.hospitals || []);
    } catch (e) {
      toast.error("Không thể lấy danh sách bệnh viện");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSyncOverpass = async () => {
    if (syncingHospitals) return;
    setSyncingHospitals(true);
    toast.info("Đang kết nối tới Overpass API để đồng bộ dữ liệu bệnh viện y tế...");
    try {
      await postRequest("/api/admin/hospitals/sync-overpass");
      toast.success("Đồng bộ danh sách bệnh viện thành công!");
      await fetchHospitals();
    } catch (e: any) {
      toast.error(e.message || "Không thể đồng bộ danh sách bệnh viện từ Overpass");
    } finally {
      setSyncingHospitals(false);
    }
  };

  const fetchMedicines = async (page = 1, search = medSearch) => {
    setLoadingMeds(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(MED_PAGE_SIZE) });
      if (search) params.append("search", search);
      const data = await getRequest(`/api/admin/medicines?${params.toString()}`);
      setMedicines(data.medicines || []);
      setMedPage(data.page || page);
      setMedTotalPages(data.totalPages || 1);
      setMedTotal(data.total || 0);
    } catch (e) {
      toast.error("Không thể lấy danh sách kho thuốc");
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (activeTab === 'overview') {
      fetchAppointments(1, appFilterMonth, appFilterYear, appFilterDay, appFilterStatus);
      getRequest("/api/admin/stats")
        .then(data => { if (!controller.signal.aborted) setStats(data); })
        .catch(() => {});
    } else if (activeTab === 'doctors') {
      fetchDoctors();
      fetchHospitals();
    } else if (activeTab === 'hospitals') {
      fetchHospitals();
    } else if (activeTab === 'medicines') {
      fetchMedicines();
    }

    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAppointments(1, appFilterMonth, appFilterYear, appFilterDay, appFilterStatus);
    }
  }, [appFilterMonth, appFilterYear, appFilterDay, appFilterStatus]);

  // Handler: Thêm/Sửa Bác sĩ
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data;
      if (editingDocId) {
        data = await putRequest(`/api/admin/doctors/${editingDocId}`, docForm);
        if (data) {
          toast.success("Cập nhật thông tin bác sĩ thành công!");
        }
      } else {
        data = await postRequest("/api/admin/doctors", docForm);
        if (data) {
          toast.success("Thêm bác sĩ thành công!");
        }
      }
      if (data) {
        setShowDocModal(false);
        setEditingDocId(null);
        fetchDoctors(1);
        setDocForm({
          first_name: "", last_name: "", username: "", email: "", phone: "", password: "", specialty: "Đa khoa", hospital_id: ""
        });
        setHospitalSearch("");
      }
    } catch (e: any) {
      toast.error(e.message || "Kết nối đến máy chủ thất bại.");
    }
  };

  // Handler: Thêm/Sửa Bệnh viện
  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data;
      if (editingHospitalId) {
        data = await putRequest(`/api/admin/hospitals/${editingHospitalId}`, hospitalForm);
        if (data) {
          toast.success("Cập nhật bệnh viện thành công!");
        }
      } else {
        data = await postRequest("/api/admin/hospitals", hospitalForm);
        if (data) {
          toast.success("Thêm bệnh viện thành công!");
        }
      }
      if (data) {
        setShowHospitalModal(false);
        setEditingHospitalId(null);
        fetchHospitals();
        setHospitalForm({ name: "", address: "", phone: "", email: "", description: "" });
      }
    } catch (e: any) {
      toast.error(e.message || "Kết nối đến máy chủ thất bại.");
    }
  };

  // Handler: Xóa Bác sĩ
  const handleDeleteDoctor = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản bác sĩ này? Hành động này sẽ xóa vĩnh viễn dữ liệu bác sĩ.")) return;
    try {
      await deleteRequest(`/api/admin/doctors/${id}`);
      toast.success("Xóa bác sĩ thành công!");
      fetchDoctors(docPage);
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa bác sĩ.");
    }
  };

  // Handler: Xóa Bệnh viện
  const handleDeleteHospital = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bệnh viện này? Các bác sĩ liên kết sẽ chuyển về Đại diện hệ thống.")) return;
    try {
      await deleteRequest(`/api/admin/hospitals/${id}`);
      toast.success("Xóa bệnh viện thành công!");
      fetchHospitals();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa bệnh viện.");
    }
  };

  // Handler: Cập nhật tồn kho thuốc
  const handleUpdateStock = async (id: number, newQty: number) => {
    try {
      await postRequest(`/api/admin/medicines/${id}`, { quantity: newQty });
      toast.success("Cập nhật kho thuốc thành công!");
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, quantity: newQty } : m));
    } catch (e) {
      toast.error("Không thể cập nhật tồn kho");
    }
  };

  // Handler: Tự động đồng bộ AI Bệnh lý ( Wikipedia/PubMed Sync)
  const handleSyncAI = async (e?: React.FormEvent, isBulk = false) => {
    if (e) e.preventDefault();
    if (!isBulk && !diseaseInput.trim()) return;

    setSyncingAI(true);
    try {
      const bodyPayload = isBulk ? {} : { diseaseName: diseaseInput };
      const data = await postRequest("/api/admin/diseases/sync-auto", bodyPayload);
      toast.success(data.message || "Đồng bộ AI bệnh lý hoàn tất!");
      setDiseaseInput("");
    } catch (e: any) {
      toast.error(e.message || "Lỗi kết nối máy chủ AI");
    } finally {
      setSyncingAI(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar quản trị */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 h-full overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <Activity className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="font-extrabold text-sm tracking-wider uppercase text-purple-400">Admin Portal</h1>
            <p className="text-[10px] text-slate-400">Hệ thống Y tế số</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Users className="h-4 w-4" />
            <span>Tổng quan hệ thống</span>
          </button>

          <button 
            onClick={() => setActiveTab('doctors')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'doctors' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Quản lý Bác sĩ</span>
          </button>

          {/* Chỉ hiển thị Quản lý Bệnh viện cho Admin Tổng (hospital_id là null hoặc bằng 0) */}
          {(!user?.hospital_id || user?.hospital_id === 0) && (
            <button 
              onClick={() => setActiveTab('hospitals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'hospitals' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Building2 className="h-4 w-4" />
              <span>Quản lý Bệnh viện</span>
            </button>
          )}

          {/* Chỉ hiển thị Kho thuốc cho Admin Bệnh viện nhỏ (có hospital_id hợp lệ > 0) */}
          {user?.hospital_id && user?.hospital_id > 0 && (
            <button 
              onClick={() => setActiveTab('medicines')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'medicines' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Pill className="h-4 w-4" />
              <span>Quản lý Kho thuốc</span>
            </button>
          )}

          {/* Chỉ hiển thị Đồng bộ Y khoa AI cho Admin Tổng (hospital_id là null hoặc bằng 0) */}
          {(!user?.hospital_id || user?.hospital_id === 0) && (
            <button 
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Đồng bộ Y khoa AI</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất hệ thống</span>
          </button>
        </div>
      </aside>

      {/* Vùng Content chính */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 h-full">
        
        {/* Header trên */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
              {activeTab === 'overview' && "Tổng quan hệ thống"}
              {activeTab === 'doctors' && "Danh sách Bác sĩ"}
              {activeTab === 'hospitals' && "Danh sách Bệnh viện đối tác"}
              {activeTab === 'medicines' && "Kho dược phẩm Việt Nam"}
              {activeTab === 'ai' && "Cấu hình AI chẩn đoán bệnh"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chào mừng, <strong>{user?.Username || "Quản trị viên"}</strong>. Quản trị phân quyền hệ thống toàn vẹn.
            </p>
          </div>
        </div>

        {/* --- TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bác sĩ công tác</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.doctors}</h3>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500"><Stethoscope className="h-6 w-6" /></div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bệnh viện liên kết</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.hospitals}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500"><Building2 className="h-6 w-6" /></div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Danh mục Thuốc</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.medicines}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Pill className="h-6 w-6" /></div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tỷ lệ chính xác AI</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">92.5%</h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500"><BrainCircuit className="h-6 w-6" /></div>
            </div>
          </div>

          <div className="space-y-6 mt-6">
            {/* Bảng lịch đặt hẹn */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xs">
              {/* Header + Bộ lọc */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Lịch đặt hẹn khám
                  {appTotal > 0 && <span className="ml-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{appTotal} lịch</span>}
                </h4>

                {/* Bộ lọc ngày + tháng + năm + trạng thái */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={appFilterDay}
                    onChange={(e) => {
                      setAppFilterDay(e.target.value);
                      fetchAppointments(1, appFilterMonth, appFilterYear, e.target.value, appFilterStatus);
                    }}
                    className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Tất cả ngày</option>
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>Ngày {d}</option>
                    ))}
                  </select>

                  <select
                    value={appFilterMonth}
                    onChange={(e) => {
                      setAppFilterMonth(e.target.value);
                      fetchAppointments(1, e.target.value, appFilterYear, appFilterDay, appFilterStatus);
                    }}
                    className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Tất cả tháng</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={String(m)}>Tháng {m}</option>
                    ))}
                  </select>

                  <select
                    value={appFilterYear}
                    onChange={(e) => {
                      setAppFilterYear(e.target.value);
                      fetchAppointments(1, appFilterMonth, e.target.value, appFilterDay, appFilterStatus);
                    }}
                    className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>

                  <select
                    value={appFilterStatus}
                    onChange={(e) => {
                      setAppFilterStatus(e.target.value);
                      fetchAppointments(1, appFilterMonth, appFilterYear, appFilterDay, e.target.value);
                    }}
                    className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="confirmed">Đã duyệt</option>
                    <option value="completed">Đã khám</option>
                    <option value="cancelled">Đã huỷ</option>
                  </select>

                  {(appFilterDay || appFilterMonth || appFilterStatus) && (
                    <button
                      onClick={() => {
                        setAppFilterDay('');
                        setAppFilterMonth('');
                        setAppFilterStatus('');
                        fetchAppointments(1, '', appFilterYear, '', '');
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 border border-rose-200 rounded-lg px-2 py-1 transition cursor-pointer"
                    >✕ Xoá lọc</button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-450 uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">#</th>
                      <th className="p-3">Bệnh nhân</th>
                      <th className="p-3">Bác sĩ phụ trách</th>
                      <th className="p-3">Bệnh viện diễn ra</th>
                      <th className="p-3">Ngày hẹn khám</th>
                      <th className="p-3 w-32 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {appFilterMonth ? `Không có lịch hẹn nào trong tháng ${appFilterMonth}/${appFilterYear}.` : 'Không có dữ liệu lịch hẹn khám nào.'}
                        </td>
                      </tr>
                    ) : (
                      appointments.map((app, idx) => (
                        <tr
                          key={app.id}
                          onClick={() => { setSelectedAppointment(app); setShowAppDetailModal(true); }}
                          className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 cursor-pointer transition-all"
                        >
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{(appPage - 1) * APP_PAGE_SIZE + idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {app.User ? `${app.User.last_name} ${app.User.first_name}` : 'N/A'}
                          </td>
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-350">
                            {app.Doctor?.User ? `BS. ${app.Doctor.User.last_name} ${app.Doctor.User.first_name}` : 'Đang cập nhật'}
                            <span className="block text-[10px] font-normal text-slate-400">{app.Doctor?.specialty || 'Đa khoa'}</span>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">{app.Hospital?.name || 'Đại diện hệ thống'}</td>
                          <td className="p-3 font-mono text-purple-600 dark:text-purple-400 font-bold">
                            {app.appointment_date} ({app.appointment_time})
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase tracking-wide ${
                              app.status === 'confirmed' || app.status === 'approved' ? 'bg-sky-500/10 text-sky-600' :
                              app.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                              app.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {app.status === 'confirmed' || app.status === 'approved' ? 'Đã duyệt' :
                               app.status === 'completed' ? 'Đã khám' :
                               app.status === 'cancelled' ? 'Đã huỷ' : 'Chờ duyệt'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang thông minh */}
              {appTotalPages > 1 && (() => {
                const pages: (number | '...')[] = [];
                const delta = 2;
                for (let i = 1; i <= appTotalPages; i++) {
                  if (i === 1 || i === appTotalPages || (i >= appPage - delta && i <= appPage + delta)) {
                    pages.push(i);
                  } else if (i === appPage - delta - 1 || i === appPage + delta + 1) {
                    pages.push('...');
                  }
                }
                return (
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                      Hiển thị {(appPage - 1) * APP_PAGE_SIZE + 1}–{Math.min(appPage * APP_PAGE_SIZE, appTotal)} / {appTotal} lịch hẹn
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fetchAppointments(Math.max(1, appPage - 1), appFilterMonth, appFilterYear, appFilterDay, appFilterStatus)}
                        disabled={appPage === 1}
                        className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >‹</button>
                      {pages.map((p, idx) =>
                        p === '...' ? (
                          <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => fetchAppointments(p as number, appFilterMonth, appFilterYear, appFilterDay, appFilterStatus)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                              appPage === p ? 'bg-purple-600 text-white shadow-sm' :
                              'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-purple-50'
                            }`}
                          >{p}</button>
                        )
                      )}
                      <button
                        onClick={() => fetchAppointments(Math.min(appTotalPages, appPage + 1), appFilterMonth, appFilterYear, appFilterDay, appFilterStatus)}
                        disabled={appPage === appTotalPages}
                        className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >›</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          </div>
        )}

        {/* --- TAB 2: DOCTORS --- */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowDocModal(true)}
                className="bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4" /> Thêm Bác sĩ mới
              </button>
            </div>

            {loadingDocs ? (
              <div className="text-center py-10"><RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" /></div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-450 uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Tài khoản</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Điện thoại</th>
                      <th className="p-4">Chuyên khoa</th>
                      <th className="p-4">Bệnh viện</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {doctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                          {doc.User ? `${doc.User.last_name} ${doc.User.first_name}` : "N/A"}
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{doc.User?.username}</td>
                        <td className="p-4 text-slate-650 dark:text-slate-350">{doc.User?.email}</td>
                        <td className="p-4 font-medium">{doc.User?.phone || "Chưa cập nhật"}</td>
                        <td className="p-4"><span className="bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-lg font-bold text-[10px]">{doc.specialty}</span></td>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{doc.Hospital?.name || "Đại diện hệ thống"}</td>
                        <td className="p-4 text-center space-x-3 shrink-0">
                          <button
                            onClick={() => {
                              setEditingDocId(doc.id);
                              setDocForm({
                                first_name: doc.User?.first_name || "",
                                last_name: doc.User?.last_name || "",
                                username: doc.User?.username || "",
                                email: doc.User?.email || "",
                                phone: doc.User?.phone || "",
                                password: "", // Sửa không cần nhập lại pass trừ khi đổi
                                specialty: doc.specialty || "Đa khoa",
                                hospital_id: "" // Cần set lại bằng ID bệnh viện
                              });
                              setShowDocModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {docTotalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-3">
                <button onClick={() => { if (docPage > 1) fetchDoctors(docPage - 1); }} disabled={docPage <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">&laquo;</button>
                {Array.from({ length: docTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => fetchDoctors(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === docPage ? "bg-purple-600 text-white shadow-md" : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{p}</button>
                ))}
                <button onClick={() => { if (docPage < docTotalPages) fetchDoctors(docPage + 1); }} disabled={docPage >= docTotalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">&raquo;</button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: HOSPITALS --- */}
        {activeTab === 'hospitals' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleSyncOverpass}
                disabled={syncingHospitals}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${syncingHospitals ? "animate-spin" : ""}`} /> 
                <span>{syncingHospitals ? "Đang đồng bộ..." : "Cập nhật từ Overpass API"}</span>
              </button>
              <button 
                onClick={() => setShowHospitalModal(true)}
                className="bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4" /> Thêm Bệnh viện mới
              </button>
            </div>

            {loadingHospitals ? (
              <div className="text-center py-10"><RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hospitals.map(hosp => (
                  <div key={hosp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{hosp.name}</h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {hosp.address}</p>
                      </div>
                      <Building2 className="h-5 w-5 text-purple-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{hosp.description || "Không có mô tả chi tiết."}</p>
                    <div className="flex gap-4 pt-2 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/60 justify-between items-center">
                      <div className="flex gap-3">
                        <span>ĐT: {hosp.phone || "N/A"}</span>
                        <span>Email: {hosp.email || "N/A"}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingHospitalId(hosp.id);
                            setHospitalForm({
                              name: hosp.name,
                              address: hosp.address,
                              phone: hosp.phone || "",
                              email: hosp.email || "",
                              description: hosp.description || ""
                            });
                            setShowHospitalModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteHospital(hosp.id)}
                          className="text-rose-600 hover:text-rose-850 font-bold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: MEDICINES --- */}
        {activeTab === 'medicines' && (
          <div className="space-y-4">
            {/* Header + Tìm kiếm */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-500 font-semibold">
                Tổng cộng <strong className="text-slate-800 dark:text-slate-100">{medTotal}</strong> dược phẩm trong kho
              </p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc mã dược..."
                    value={medSearch}
                    onChange={(e) => {
                      setMedSearch(e.target.value);
                      fetchMedicines(1, e.target.value);
                    }}
                    className="pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 w-64"
                  />
                </div>
              </div>
            </div>

            {loadingMeds ? (
              <div className="text-center py-10"><RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" /></div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                {medSearch ? `Không tìm thấy dược phẩm nào khớp với "${medSearch}"` : 'Kho thuốc đang trống.'}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-450 uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Tên dược phẩm</th>
                      <th className="p-4 w-40">Mã dược (NDC/FDA)</th>
                      <th className="p-4 w-28">Đơn vị</th>
                      <th className="p-4 w-48 text-center">Số lượng tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {medicines.map(med => (
                      <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{med.name}</td>
                        <td className="p-4 font-mono text-slate-400 text-[10px]">{med.code || 'VN-REGISTERED'}</td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{med.unit || 'viên'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              defaultValue={med.quantity}
                              onBlur={(e) => handleUpdateStock(med.id, Number(e.target.value))}
                              className="w-20 border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-2 py-1 text-center font-black text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">còn lại</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Phân trang */}
                {medTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Trang {medPage}/{medTotalPages} · {medTotal} dược phẩm
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fetchMedicines(Math.max(1, medPage - 1))}
                        disabled={medPage === 1}
                        className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >‹</button>
                      {Array.from({ length: Math.min(5, medTotalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(medTotalPages - 4, medPage - 2)) + i;
                        return (
                          <button
                            key={p}
                            onClick={() => fetchMedicines(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                              medPage === p ? 'bg-purple-600 text-white shadow-sm' :
                              'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-purple-50'
                            }`}
                          >{p}</button>
                        );
                      })}
                      <button
                        onClick={() => fetchMedicines(Math.min(medTotalPages, medPage + 1))}
                        disabled={medPage === medTotalPages}
                        className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      >›</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 5: AI SYNC --- */}
        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm">Đồng bộ Tri thức Y học AI thông minh</h3>
              <p className="text-[11px] text-slate-400 max-w-xl leading-relaxed">
                Hệ thống tự động liên kết Wikipedia, PubMed, NCBI để trích xuất các triệu chứng, cách chuẩn đoán, liều lượng cách điều trị y học thực tế và tự lập trình mô hình xác suất Bayes cho AI 1-click.
              </p>
            </div>

            <div className="flex flex-col space-y-4 max-w-xl">
              <form onSubmit={handleSyncAI} className="flex flex-col sm:flex-row gap-3 w-full">
                <input 
                  type="text" 
                  placeholder="Nhập tên bệnh lý (Ví dụ: Sốt xuất huyết, Đau dạ dày, Cúm A...)"
                  value={diseaseInput}
                  onChange={(e) => setDiseaseInput(e.target.value)}
                  required
                  className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  type="submit"
                  disabled={syncingAI}
                  className="bg-purple-600 hover:bg-purple-750 disabled:bg-slate-200 text-white font-bold text-xs flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl cursor-pointer shadow-md transition-all shrink-0"
                >
                  {syncingAI ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang đồng bộ...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      <span>Đồng bộ bệnh lý</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoặc</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  Đồng bộ toàn bộ cơ sở dữ liệu Tri thức Y học AI
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hệ thống tự động đồng bộ tất cả bệnh lý phổ biến có sẵn (Tiểu đường, Tăng huyết áp, Đau dạ dày, Cúm A, Sốt xuất huyết...) vào cơ sở dữ liệu huấn luyện AI chỉ trong 1-click.
                </p>
                <button
                  type="button"
                  disabled={syncingAI}
                  onClick={() => handleSyncAI(undefined, true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                >
                  {syncingAI ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang xử lý đồng bộ hàng loạt...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      <span>Đồng bộ TOÀN BỘ Tri thức Y khoa AI (Khuyên dùng)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL 3: CHI TIẾT LỊCH HẸN KHÁM --- */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedAppointment(null)} />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Chi tiết Lịch hẹn khám
              </h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-slate-450 hover:text-slate-600 font-bold transition-all">❌</button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto text-xs font-semibold leading-relaxed">
              {/* Thông tin bệnh nhân */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Thông tin Bệnh nhân</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-350">
                  <p>Họ tên: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.User ? `${selectedAppointment.User.last_name} ${selectedAppointment.User.first_name}` : '--'}</strong></p>
                  <p>Email: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.User?.email || '--'}</strong></p>
                  <p>Điện thoại: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.User?.phone || '--'}</strong></p>
                  <p>Giới tính: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.User?.gender === 'male' ? 'Nam' : selectedAppointment.User?.gender === 'female' ? 'Nữ' : 'Khác'}</strong></p>
                </div>
              </div>

              {/* Thông tin bác sĩ & bệnh viện */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Bác sĩ & Bệnh viện phụ trách</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-350">
                  <p>Bác sĩ: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.Doctor?.User ? `BS. ${selectedAppointment.Doctor.User.last_name} ${selectedAppointment.Doctor.User.first_name}` : '--'}</strong></p>
                  <p>Chuyên khoa: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.Doctor?.specialty || '--'}</strong></p>
                  <p className="col-span-2">Bệnh viện diễn ra: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.Doctor?.Hospital?.name || selectedAppointment.Hospital?.name || 'Bệnh viện liên kết'}</strong></p>
                </div>
              </div>

              {/* Chi tiết ca hẹn */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Chi tiết Ca hẹn khám</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-350">
                  <p>Ngày hẹn: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.appointment_date ? new Date(selectedAppointment.appointment_date).toLocaleDateString('vi-VN') : '--'}</strong></p>
                  <p>Giờ hẹn: <strong className="text-slate-900 dark:text-slate-100">{selectedAppointment.appointment_time || '--'}</strong></p>
                  <p>Hình thức: <strong className="text-slate-900 dark:text-slate-100 text-uppercase">{selectedAppointment.payment_type === 'insurance' ? 'Bảo hiểm' : 'Dịch vụ'}</strong></p>
                  <p>Trạng thái: 
                    <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      selectedAppointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                      selectedAppointment.status === 'confirmed' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30' :
                      selectedAppointment.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                    }`}>
                      {selectedAppointment.status === 'completed' ? 'Đã hoàn thành' :
                       selectedAppointment.status === 'confirmed' ? 'Đã duyệt' :
                       selectedAppointment.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </span>
                  </p>
                  <p className="col-span-2">Lý do khám: <span className="text-slate-800 dark:text-slate-200">{selectedAppointment.notes || '--'}</span></p>
                  
                  {/* Kết luận bác sĩ: Hiển thị kết luận từ result_notes thay vì nhãn Đã xong chung chung */}
                  {selectedAppointment.status === 'completed' && (
                    <p className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                      Kết luận của bác sĩ: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedAppointment.result_notes || 'Bác sĩ chưa ghi nhận kết luận thực tế.'}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: THÊM BÁC SĨ MỚI --- */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setShowDocModal(false); setEditingDocId(null); }} />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {editingDocId ? "Cập nhật thông tin Bác sĩ" : "Thêm Bác sĩ Mới"}
              </h3>
              <button onClick={() => { setShowDocModal(false); setEditingDocId(null); }} className="text-slate-450 hover:text-slate-600 font-bold">❌</button>
            </div>
            <form onSubmit={handleAddDoctor} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Họ</label>
                  <input type="text" required value={docForm.last_name} onChange={(e) => setDocForm({...docForm, last_name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên</label>
                  <input type="text" required value={docForm.first_name} onChange={(e) => setDocForm({...docForm, first_name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên tài khoản (đăng nhập)</label>
                <input type="text" required={!editingDocId} disabled={!!editingDocId} value={docForm.username} onChange={(e) => setDocForm({...docForm, username: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50" />
              </div>
              {!editingDocId && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mật khẩu bác sĩ</label>
                  <input type="password" required={!editingDocId} value={docForm.password} onChange={(e) => setDocForm({...docForm, password: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email công tác</label>
                <input type="email" required value={docForm.email} onChange={(e) => setDocForm({...docForm, email: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Số điện thoại</label>
                <input type="text" value={docForm.phone} onChange={(e) => setDocForm({...docForm, phone: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chuyên khoa</label>
                <input type="text" value={docForm.specialty} onChange={(e) => setDocForm({...docForm, specialty: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bệnh viện công tác</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Gõ tên bệnh viện để tìm..." 
                    value={hospitalSearch} 
                    onChange={(e) => { setHospitalSearch(e.target.value); setShowHospitalDropdown(true); setDocForm({...docForm, hospital_id: ""}); }}
                    onFocus={() => setShowHospitalDropdown(true)}
                    onBlur={() => setTimeout(() => setShowHospitalDropdown(false), 150)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {showHospitalDropdown && hospitals.length > 0 && (
                    <ul className="absolute z-30 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                      {hospitals.filter(h => h.name.toLowerCase().includes(hospitalSearch.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-xs text-slate-400 italic">Không tìm thấy bệnh viện</li>
                      )}
                      {hospitals.filter(h => h.name.toLowerCase().includes(hospitalSearch.toLowerCase())).map(h => (
                        <li 
                          key={h.id} 
                          onClick={() => { setDocForm({...docForm, hospital_id: String(h.id)}); setHospitalSearch(h.name); setShowHospitalDropdown(false); }}
                          className={`px-3 py-2 text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-slate-800 ${docForm.hospital_id === String(h.id) ? "bg-purple-50 dark:bg-slate-800 font-bold text-purple-700 dark:text-purple-400" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {h.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setShowDocModal(false); setEditingDocId(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-md">Đồng ý</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: THÊM BỆNH VIỆN MỚI --- */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setShowHospitalModal(false); setEditingHospitalId(null); }} />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {editingHospitalId ? "Cập nhật thông tin Bệnh viện" : "Thêm Bệnh viện Mới"}
              </h3>
              <button onClick={() => { setShowHospitalModal(false); setEditingHospitalId(null); }} className="text-slate-450 hover:text-slate-600 font-bold">❌</button>
            </div>
            <form onSubmit={handleAddHospital} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên bệnh viện / Phòng khám</label>
                <input type="text" required value={hospitalForm.name} onChange={(e) => setHospitalForm({...hospitalForm, name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Địa chỉ chi tiết</label>
                <input type="text" required value={hospitalForm.address} onChange={(e) => setHospitalForm({...hospitalForm, address: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Số điện thoại</label>
                  <input type="text" value={hospitalForm.phone} onChange={(e) => setHospitalForm({...hospitalForm, phone: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email liên hệ</label>
                  <input type="email" value={hospitalForm.email} onChange={(e) => setHospitalForm({...hospitalForm, email: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mô tả giới thiệu</label>
                <textarea rows={3} value={hospitalForm.description} onChange={(e) => setHospitalForm({...hospitalForm, description: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 resize-none" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setShowHospitalModal(false); setEditingHospitalId(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-md">
                  {editingHospitalId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}