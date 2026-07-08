import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  History as HistoryIcon,
  Calendar,
  Search,
  ArrowRight,
  Activity,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Printer
} from "lucide-react";
import { getSearchHistory, getPredictHistory } from "../api/history";
import { getDiseaseDetailFromDiseases, searchDiseases } from "../api/diseases";
import { predictSymptoms } from "../api/symptoms";
import { getMyAppointments, updateAppointmentStatus } from "../api/appointment";
import { postRequest } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

// Interfaces
interface HistoryResultItem {
  name?: string;
  name_vi?: string;
  name_en?: string;
  score?: number | string;
}

interface SearchHistoryItem {
  _id?: string;
  diseaseId?: string;
  searchName?: string;
  diseaseName?: string;
  name?: string;
  createdAt?: string;
  time?: string;
  date?: string;
  result?: HistoryResultItem[];
  symptoms?: string[];
}

interface DiseaseResult {
  name: string;
  name_vi?: string;
  score: number;
  _id?: string;
  id?: string;
  diseaseId?: string;
}

interface PredictHistoryItem {
  time?: string;
  createdAt?: string;
  inputSymptoms?: string[];
  symptoms?: string[];
  input?: string;
  payload?: any;
  result?: DiseaseResult[];
  lastResult?: {
    data?: DiseaseResult[];
  };
}

interface AppointmentItem {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  payment_type?: 'service' | 'insurance';
  insurance_card_number?: string;
  Doctor?: {
    name: string;
    specialty: string;
    fee: number;
  };
  Hospital?: {
    name: string;
    address: string;
  };
  Disease?: {
    name: string;
  };
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const activeTab = searchParams.get("tab") || "search";

  // State loading & data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lists
  const [searchItems, setSearchItems] = useState<SearchHistoryItem[]>([]);
  const [predictItems, setPredictItems] = useState<PredictHistoryItem[]>([]);
  const [bookingItems, setBookingItems] = useState<AppointmentItem[]>([]);

  // Sub-states
  const [runningId, setRunningId] = useState<number | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Hàm in phiếu khám cho một lịch hẹn từ History
  function handlePrintAppointment(item: AppointmentItem) {
    const formattedDate = item.appointment_date.split("-").reverse().join("/");
    const formattedTime = item.appointment_time.slice(0, 5);
    const sttNum = String((item.id % 99) + 1).padStart(2, "0");
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
    const feeVal = Number(item.Doctor?.fee || 0);
    const finalCost = item.payment_type === 'insurance' ? Math.max(0, feeVal * 0.2) : feeVal;
    const printDate = new Date().toLocaleDateString("vi-VN");
    const printTime = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

    // Tìm tên bệnh từ notes nếu có
    let diseaseName = item.Disease?.name || "";
    const noteMatch = item.notes?.match(/^\[Bệnh lý:\s*([^\]]+)\]/);
    if (noteMatch) diseaseName = noteMatch[1];
    const cleanNotes = item.notes?.replace(/^\[Bệnh lý:\s*[^\]]+\]\s*/, "") || "Không có.";

    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Phiếu khám #LH-${item.id}</title>
<style>
  @page { size: A4 portrait; margin: 10mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid black; padding-bottom: 6px; margin-bottom: 8px; }
  .stt-box { border: 1px solid black; padding: 4px 12px; text-align: center; border-radius: 2px; }
  .title { text-align: center; margin: 8px 0; }
  .section { border: 1px solid black; border-radius: 2px; padding: 6px 8px; margin-bottom: 6px; }
  .section h3 { font-size: 8px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 4px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px; font-size: 9px; }
  .span2 { grid-column: 1 / -1; }
  .bmi-row { border-top: 1px dashed black; padding-top: 2px; margin-top: 2px; display: flex; gap: 16px; }
  .fee-row { display: flex; justify-content: space-between; align-items: center; font-size: 9px; }
  .note-box { font-size: 8px; color: #000; border: 1px solid black; padding: 4px 6px; border-radius: 2px; margin-bottom: 6px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center; font-size: 9px; margin-top: 4px; }
  .sig-space { height: 40px; display: flex; align-items: center; justify-content: center; }
</style></head><body>
  <div class="header">
    <div>
      <p style="font-size:8px;text-transform:uppercase;font-weight:bold">SỞ Y TẾ THÀNH PHỐ HỒ CHÍ MINH</p>
      <p style="font-size:12px;font-weight:900;text-transform:uppercase;margin-top:2px">${item.Hospital?.name || 'BỆNH VIỆN ĐA KHOA'}</p>
      <p style="font-size:8px;margin-top:2px">${item.Hospital?.address || ''}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:8px;font-weight:bold">Mã phiếu: <strong>#LH-${item.id}</strong></p>
      <div class="stt-box" style="margin-top:2px;display:inline-block">
        <p style="font-size:6px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em">Số Thứ Tự Khám</p>
        <p style="font-size:24px;font-weight:900;line-height:1;margin-top:1px">${sttNum}</p>
      </div>
    </div>
  </div>
  <div class="title">
    <h1 style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.05em">PHIẾU ĐĂNG KÝ KHÁM BỆNH</h1>
    <p style="font-size:8px;font-style:italic;margin-top:1px">(Dành cho bệnh nhân đặt lịch hẹn trực tuyến)</p>
    <p style="font-size:8px;font-weight:bold;margin-top:1px">Ngày in phiếu: ${printDate} lúc ${printTime}</p>
  </div>
  <div class="section">
    <h3>I. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN</h3>
    <div class="grid2">
      <p><strong>Họ và tên:</strong> <span style="text-transform:uppercase;font-weight:bold">${user?.First_name || ''} ${user?.Last_name || ''}</span></p>
      <p><strong>Ngày sinh:</strong> ${user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('vi-VN') : '--'} (${ageStr})</p>
      <p><strong>Giới tính:</strong> ${genderStr}</p>
      <p><strong>Số điện thoại:</strong> ${user?.phone || '--'}</p>
      <p class="span2"><strong>Địa chỉ thường trú:</strong> ${user?.address || '--'}</p>
      ${bmiStr ? `<p class="span2 bmi-row"><span><strong>Chiều cao:</strong> ${user?.height} cm</span><span><strong>Cân nặng:</strong> ${user?.weight} kg</span><span><strong>BMI:</strong> ${bmiStr} (${Number(bmiStr) < 18.5 ? 'Gầy' : Number(bmiStr) < 24.9 ? 'Bình thường' : 'Thừa cân'})</span></p>` : ''}
    </div>
  </div>
  <div class="section">
    <h3>II. CHI TIẾT LỊCH HẸN KHÁM</h3>
    <div class="grid2">
      <p><strong>Chuyên khoa:</strong> ${item.Doctor?.specialty || '--'}</p>
      <p><strong>Bác sĩ phụ trách:</strong> ${item.Doctor?.name || '--'}</p>
      <p><strong>Ngày hẹn khám:</strong> <strong>${formattedDate}</strong></p>
      <p><strong>Giờ hẹn dự kiến:</strong> <strong>${formattedTime}</strong></p>
      <p><strong>Phòng khám:</strong> Phòng ${100 + (item.id % 20)} - Lầu 1</p>
      <p><strong>Hình thức:</strong> <span style="text-transform:uppercase;font-weight:bold">${item.payment_type === 'insurance' ? 'BHYT' : 'Dịch vụ'}</span></p>
      ${item.insurance_card_number ? `<p class="span2"><strong>Số thẻ BHYT:</strong> <span style="font-family:monospace;font-weight:bold">${item.insurance_card_number}</span></p>` : ''}
      ${diseaseName ? `<p class="span2"><strong>Bệnh lý / Triệu chứng:</strong> ${diseaseName}</p>` : ''}
      <p class="span2"><strong>Ghi chú:</strong> ${cleanNotes}</p>
    </div>
  </div>
  <div class="section">
    <h3>III. CHI PHÍ KHÁM LÂM SÀNG</h3>
    <div class="fee-row">
      <div>
        <p><strong>Giá khám niêm yết:</strong> ${feeVal.toLocaleString('vi-VN')} VNĐ</p>
        ${item.payment_type === 'insurance' ? `<p style="font-weight:bold;margin-top:1px">Giảm trừ BHYT: -80% giá niêm yết (-${(feeVal * 0.8).toLocaleString('vi-VN')} VNĐ)</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="font-size:7px;font-weight:bold;text-transform:uppercase">TỔNG TIỀN TẠM TÍNH</p>
        <p style="font-size:13px;font-weight:900;margin-top:1px">${finalCost.toLocaleString('vi-VN')} VNĐ</p>
      </div>
    </div>
  </div>
  <div class="note-box">
    <p style="font-weight:bold;text-transform:uppercase;margin-bottom:1px">⚠️ LƯU Ý DÀNH CHO BỆNH NHÂN:</p>
    <p>1. Mang theo <strong>Thẻ BHYT gốc + CCCD</strong> để đối chiếu thông tin khi đến.</p>
    <p>2. Có mặt tại <strong>Quầy tiếp nhận số 1</strong> trước giờ hẹn <strong>15 phút</strong>.</p>
    <p>3. Phiếu này là xác nhận đặt lịch trực tuyến, chưa phải số thứ tự chính thức tại bệnh viện.</p>
  </div>
  <div class="sig-grid">
    <div>
      <p style="font-style:italic">Ngày ..... tháng ..... năm 2026</p>
      <p style="font-weight:bold;text-transform:uppercase;margin-top:1px">NGƯỜI LẬP PHIẾU</p>
      <p style="font-size:7px">(Ký, ghi rõ họ tên)</p>
      <div class="sig-space"><span style="font-style:italic;font-size:9px">Hệ thống Healthcare</span></div>
    </div>
    <div>
      <p style="font-style:italic">Ngày ..... tháng ..... năm 2026</p>
      <p style="font-weight:bold;text-transform:uppercase;margin-top:1px">BỆNH NHÂN XÁC NHẬN</p>
      <p style="font-size:7px">(Ký, ghi rõ họ tên)</p>
      <div class="sig-space"><span style="font-weight:bold;text-transform:uppercase;font-size:9px">${user?.First_name || ''} ${user?.Last_name || ''}</span></div>
    </div>
  </div>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => { w.focus(); w.print(); };
    }
  }

  // Hàm hủy cuộc hẹn
  async function handleCancelAppointment(id: number) {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn khám này không?")) {
      return;
    }
    try {
      await updateAppointmentStatus(id, "cancelled");
      toast.success("Hủy lịch khám thành công!");
      // Tải lại danh sách lịch hẹn
      const res = await getMyAppointments();
      const appointments = res.data || res || [];
      setBookingItems(appointments);
    } catch (err: any) {
      toast.error(err.message || "Không thể hủy lịch khám. Vui lòng thử lại!");
    }
  }

  // Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Vui lòng đăng nhập để xem lịch sử.");
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "search") {
          const res = await getSearchHistory();
          const history: SearchHistoryItem[] = (res && res.data) || (Array.isArray(res) ? res : []);
          
          // De-dupe: chỉ giữ bản mới nhất cho mỗi tên bệnh
          const seen = new Set<string>();
          const deduped = history.filter((it) => {
            const key = (it.diseaseName || it.searchName || it.name || "").toLowerCase().trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setSearchItems(deduped);
        } else if (activeTab === "predict") {
          const res = await getPredictHistory();
          const history = res.data || res || [];
          setPredictItems(history);
        } else if (activeTab === "booking") {
          const res = await getMyAppointments();
          const appointments = res.data || res || [];
          setBookingItems(appointments);
        }
      } catch (err: any) {
        console.error(`[HistoryPage] Error loading ${activeTab}:`, err);
        setError(err.message || "Không thể tải dữ liệu lịch sử.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isLoggedIn, activeTab, toast]);

  // Actions for Search History
  async function viewFromHistory(entry: SearchHistoryItem) {
    setViewLoading(true);
    try {
      const name = entry.diseaseName || entry.searchName || entry.name;
      if (name) {
        const searchRes: any = await postRequest("/api/diseases/search", { name });
        const first = searchRes?.data?.[0];
        if (first) {
          const fid = first.id || first._id;
          const detail = await getDiseaseDetailFromDiseases(String(fid));
          navigate(`/disease/${fid}`, { state: { detail } });
          return;
        }
      }

      const directId = entry.diseaseId || entry._id;
      if (directId && String(directId).includes('/')) {
        const detail = await getDiseaseDetailFromDiseases(directId);
        navigate(`/disease/${directId}`, { state: { detail } });
        return;
      }
      toast.error("Không tìm thấy thông tin chi tiết cho mục này.");
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi khi mở chi tiết bệnh.");
    } finally {
      setViewLoading(false);
    }
  }

  // Actions for Predict History
  async function rerun(entry: PredictHistoryItem, idx: number) {
    try {
      setRunningId(idx);
      const symptoms = entry.inputSymptoms || entry.symptoms || entry.input || entry.payload || [];
      if (!Array.isArray(symptoms) || symptoms.length === 0) {
        toast.error("Không có triệu chứng để chạy lại.");
        setRunningId(null);
        return;
      }

      const res = await predictSymptoms(symptoms);
      const updated = [...predictItems];
      updated[idx] = { ...updated[idx], lastResult: res };
      setPredictItems(updated);
      toast.success("Đã chạy lại dự đoán thành công!");
    } catch (err: any) {
      console.error("rerun error:", err);
      toast.error(err.message || "Lỗi khi chạy lại chẩn đoán.");
    } finally {
      setRunningId(null);
    }
  }

  async function viewDetailFromResult(resItem: DiseaseResult) {
    setViewLoading(true);
    try {
      let finalId = resItem._id || resItem.id || resItem.diseaseId;
      if (!finalId) {
        const nameToSearch = resItem.name_vi || resItem.name;
        if (nameToSearch) {
          const searchRes = await searchDiseases(nameToSearch);
          if (searchRes && searchRes.data && searchRes.data.length > 0) {
            finalId = searchRes.data[0]._id;
          }
        }
      }

      if (!finalId) {
        toast.error("Không tìm thấy thông tin chi tiết cho bệnh này.");
        setViewLoading(false);
        return;
      }

      const detail = await getDiseaseDetailFromDiseases(finalId);
      navigate(`/disease/${finalId}`, { state: { detail } });
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi khi mở chi tiết.");
    } finally {
      setViewLoading(false);
    }
  }

  // Helpers
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "Không rõ thời gian";
    return new Date(timeStr).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl">
            <CheckCircle className="h-3 w-3" /> Đã xác nhận
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold rounded-xl">
            <CheckCircle className="h-3 w-3" /> Đã khám xong
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl">
            <XCircle className="h-3 w-3" /> Đã hủy lịch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl animate-pulse">
            <Clock className="h-3 w-3" /> Chờ xác nhận
          </span>
        );
    }
  };

  const getActiveList = () => {
    if (activeTab === "search") return searchItems;
    if (activeTab === "predict") return predictItems;
    return bookingItems;
  };

  const activeList = getActiveList();
  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = activeList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {viewLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Đang tải chi tiết bệnh...</span>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hồ sơ y tế</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center justify-center gap-2">
          <HistoryIcon className="h-7 w-7 text-primary" />
          Lịch sử hoạt động của bạn
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Xem lại toàn bộ lịch sử tra cứu bệnh lý, chẩn đoán triệu chứng và danh sách lịch hẹn khám bệnh của bạn.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => setParamsTab("search")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === "search"
              ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          Lịch sử tìm kiếm
        </button>
        <button
          onClick={() => setParamsTab("predict")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === "predict"
              ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          Lịch sử chẩn đoán
        </button>
        <button
          onClick={() => setParamsTab("booking")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === "booking"
              ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          Lịch sử đặt khám
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-5 space-y-3">
              <Skeleton className="h-5 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-1/4 rounded-md" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 text-center">
          <div className="text-rose-600 dark:text-rose-450 font-bold text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5" />
            <span>{error}</span>
          </div>
          {!isLoggedIn && (
            <Button
              onClick={() => navigate("/login")}
              className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold"
            >
              Đăng nhập ngay
            </Button>
          )}
        </Card>
      ) : activeTab === "search" && searchItems.length === 0 ? (
        <EmptyState
          title="Lịch sử trống"
          description="Bạn chưa thực hiện cuộc tìm kiếm bệnh nào gần đây."
          action={
            <Button
              onClick={() => navigate("/")}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs"
            >
              Tìm kiếm ngay
            </Button>
          }
        />
      ) : activeTab === "predict" && predictItems.length === 0 ? (
        <EmptyState
          title="Lịch sử chẩn đoán trống"
          description="Bạn chưa thực hiện chẩn đoán triệu chứng nào gần đây."
          action={
            <Button
              onClick={() => navigate("/predict")}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs"
            >
              Kiểm tra triệu chứng ngay
            </Button>
          }
        />
      ) : activeTab === "booking" && bookingItems.length === 0 ? (
        <EmptyState
          title="Lịch sử đặt lịch trống"
          description="Bạn chưa thực hiện đặt lịch khám bác sĩ nào gần đây."
          action={
            <Button
              onClick={() => navigate("/booking")}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs"
            >
              Đặt khám ngay
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
          {/* TAB 1: SEARCH HISTORY */}
          {activeTab === "search" &&
            (paginatedList as SearchHistoryItem[]).map((it, idx) => (
              <Card
                key={idx}
                className="p-5 hover:shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-1.5">
                      <Search className="h-4.5 w-4.5 text-primary" />
                      {it.queryText || it.diseaseName || it.searchName || it.name || "Tìm kiếm không tên"}
                    </h3>
                    {it.diseaseName && it.diseaseName !== it.queryText && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-450">
                        Đã xem chi tiết bệnh: <span className="text-accent font-bold">{it.diseaseName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatTime(it.createdAt || it.time || it.date)}</span>
                  </div>
                  {it.symptoms && it.symptoms.length > 0 && (
                    <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-1.5">
                      <div className="text-xs font-bold text-slate-450 dark:text-slate-500">
                        Triệu chứng liên quan:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {it.symptoms.slice(0, 6).map((sym, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg"
                          >
                            <span className="text-emerald-500 font-bold text-[10px]">✓</span>
                            {sym}
                          </span>
                        ))}
                        {it.symptoms.length > 6 && (
                          <span className="text-xs text-slate-450 dark:text-slate-550 font-bold">
                            +{it.symptoms.length - 6} khác
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <Button
                    onClick={() => viewFromHistory(it)}
                    variant="outline"
                    className="w-full md:w-auto font-bold text-xs flex items-center gap-1 hover:bg-primary hover:text-white hover:border-transparent transition-all"
                  >
                    <span>Xem lại</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

          {/* TAB 2: PREDICT HISTORY */}
          {activeTab === "predict" &&
            (paginatedList as PredictHistoryItem[]).map((it, idx) => {
              const globalIdx = startIndex + idx;
              const diseases = it.lastResult?.data || it.result || [];
              const symptoms = it.inputSymptoms || it.symptoms || [];

              return (
                <Card
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                        Lần chẩn đoán #{predictItems.length - globalIdx}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                        {formatTime(it.time || it.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => rerun(it, globalIdx)}
                      disabled={runningId === globalIdx}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${runningId === globalIdx ? "animate-spin" : ""}`} />
                      <span>{runningId === globalIdx ? "Đang chạy..." : "Kiểm tra lại"}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400">Triệu chứng đã nhập:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(symptoms) ? (
                        symptoms.map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold">{String(symptoms)}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-400 block">Dự đoán tương thích:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {diseases.slice(0, 4).map((dis, i) => (
                        <div
                          key={i}
                          onClick={() => viewDetailFromResult(dis)}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 cursor-pointer transition-all group"
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                              {dis.name_vi || dis.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                              {dis.score}%
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-350 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}

          {/* TAB 3: BOOKING HISTORY */}
          {activeTab === "booking" &&
            (paginatedList as AppointmentItem[]).map((item, idx) => {
              const displayTime = `${item.appointment_time.slice(0, 5)} - Ngày ${item.appointment_date.split("-").reverse().join("/")}`;
              const notesContent = item.notes || "";
              
              // Tách chi tiết bệnh lý ra khỏi notes nếu có format [Bệnh lý: ...]
              let cleanNotes = notesContent;
              let diseaseBadge = "";
              const match = notesContent.match(/^\[Bệnh lý:\s*([^\]]+)\]\s*(.*)/);
              if (match) {
                diseaseBadge = match[1];
                cleanNotes = match[2];
              }

              return (
                <Card
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center flex-wrap gap-2">
                        <span>Lịch khám hẹn #{item.id}</span>
                        {item.payment_type === 'insurance' ? (
                          <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                            BHYT {item.insurance_card_number && `(${item.insurance_card_number})`}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            Dịch vụ
                          </span>
                        )}
                        {diseaseBadge && (
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                            {diseaseBadge}
                          </span>
                        )}
                        {!diseaseBadge && item.Disease?.name && (
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                            {item.Disease.name}
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                        Thời gian khám: <span className="text-slate-600 dark:text-slate-300 font-extrabold">{displayTime}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <button
                        onClick={() => handlePrintAppointment(item)}
                        title="In phiếu khám bệnh"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        In phiếu
                      </button>
                      {(item.status === 'pending' || item.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelAppointment(item.id)}
                          className="flex items-center px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-450 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bệnh viện */}
                    <div className="flex gap-2.5 items-start">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Bệnh viện điều trị</span>
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{item.Hospital?.name}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">{item.Hospital?.address}</p>
                      </div>
                    </div>

                    {/* Bác sĩ & Chuyên khoa */}
                    <div className="flex gap-2.5 items-start">
                      <User className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Bác sĩ khám</span>
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{item.Doctor?.name}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Khoa: <span className="font-bold text-accent">{item.Doctor?.specialty}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Giá khám & Ghi chú */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-3 text-xs font-semibold text-slate-550 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Tổng tiền thanh toán: <span className="font-black text-sm text-primary">
                          {(() => {
                            const feeVal = Number(item.Doctor?.fee || 0);
                            const isIns = item.payment_type === 'insurance';
                            const finalCost = isIns ? Math.max(0, feeVal * 0.2) : feeVal;
                            return `${finalCost.toLocaleString()} VNĐ`;
                          })()}
                        </span></span>
                      </div>
                      {item.payment_type === 'insurance' && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold pl-5">
                          (Đã giảm trừ 80% chi phí do BHYT hỗ trợ chi trả)
                        </span>
                      )}
                    </div>
                    {cleanNotes && (
                      <div className="flex-1 md:text-right truncate max-w-lg">
                        <span className="text-slate-400">Lý do/Ghi chú:</span> {cleanNotes}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>

        {/* Bộ phân trang (Pagination) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-4">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </>
    )}
    </div>
  );

  function setParamsTab(tabName: string) {
    setSearchParams({ tab: tabName });
  }
}
