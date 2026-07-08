import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FileText, Download, Shield, Activity, Heart, Stethoscope, ChevronRight } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { getDiseaseDetailFromDiseases } from "../api/diseases";
import { updateSearchHistorySymptoms } from "../api/history";

interface DiseaseDetailData {
  id?: number | string;
  name: string;
  name_vi?: string;
  disease_id?: string;
  image_url?: string;
  overview?: string;
  overview_vi?: string;
  symptoms?: string[];
  symptoms_vi?: string;
  causes?: string;
  causes_vi?: string;
  diagnosis?: string | string[];
  diagnosis_vi?: string;
  treatment?: string | string[];
  treatment_vi?: string;
  department?: string;
  departments?: string;
  departments_vi?: string;
  doctors_vi?: string;
  Precaution_1?: string;
  Precaution_2?: string;
  Precaution_3?: string;
  Precaution_4?: string;
  Precaution_vi?: string;
  precautions?: string;
  wikipedia?: {
    title?: string;
    url?: string;
    summary?: string;
  } | null;
}

function ListField({ value, vi }: { value?: string | string[]; vi?: string }) {
  const rawText = vi || (typeof value === "string" ? value : "");

  if (Array.isArray(value) && !vi) {
    return (
      <ul className="list-disc pl-5 text-slate-600 dark:text-slate-350 text-sm space-y-1">
        {value.map((item, i) => (
          <li key={i} className="font-semibold leading-relaxed">{item}</li>
        ))}
      </ul>
    );
  }

  if (!rawText) return null;

  // Xử lý thông minh: Chỉ tách thành các bullet nếu văn bản thực sự có xuống dòng (\n) hoặc chứa ký tự đầu dòng (•, -)
  // Tuyệt đối không tách theo dấu phẩy (,) để tránh làm ngắt câu tiếng Việt ngẫu nhiên
  let items: string[] = [];

  if (rawText.includes("\n")) {
    items = rawText
      .split("\n")
      .map((s) => s.replace(/^[-*•\d+.]\s*/, "").trim())
      .filter(Boolean);
  } else if (rawText.includes("• ") || rawText.includes("- ")) {
    items = rawText
      .split(/(?:• |- )/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (items.length > 1) {
    return (
      <ul className="list-disc pl-5 text-slate-600 dark:text-slate-350 text-sm space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="font-medium leading-relaxed">{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-sm md:text-base whitespace-pre-line">
      {rawText}
    </p>
  );
}

export default function DiseaseDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();

  const [detail, setDetail] = useState<DiseaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stateDetail = (location.state as { detail?: DiseaseDetailData })?.detail;

    // Kiểm tra xem state có đủ nội dung hay chỉ là basic stub {id, name}
    const isFullDetail = stateDetail && (stateDetail.overview || stateDetail.causes || stateDetail.treatment);
    const isBasicStub  = stateDetail && !isFullDetail;

    if (isFullDetail) {
      // Có đầy đủ data → hiển thị ngay, không cần gọi API
      setDetail(stateDetail);
      setLoading(false);
      if (stateDetail.symptoms && Array.isArray(stateDetail.symptoms) && stateDetail.symptoms.length > 0) {
        const symNames = stateDetail.symptoms.map((s: any) =>
          typeof s === "object" ? (s.name || "") : String(s)
        ).filter(Boolean).slice(0, 8);
        const dName = stateDetail.name_vi || stateDetail.name || "";
        if (dName) updateSearchHistorySymptoms(dName, symNames);
      }
      return;
    }

    // Có basic stub hoặc không có state → hiện tên (nếu có) rồi fetch API
    if (isBasicStub) {
      setDetail(stateDetail!); // hiển thị tên ngay trong lúc chờ
    }

    if (id) {
      getDiseaseDetailFromDiseases(id)
        .then((data) => {
          if (data) {
            setDetail(data);
            if (data.symptoms && Array.isArray(data.symptoms) && data.symptoms.length > 0) {
              const symNames = data.symptoms.map((s: any) =>
                typeof s === "object" ? (s.name || "") : String(s)
              ).filter(Boolean).slice(0, 8);
              const dName = data.name_vi || data.name || "";
              if (dName) updateSearchHistorySymptoms(dName, symNames);
            }
          } else if (!isBasicStub) {
            toast.error("Không tìm thấy chi tiết bệnh.");
            navigate("/search");
          }
        })
        .catch((err) => {
          console.error("[DiseaseDetail] Fetch error:", err);
          // Nếu đã có basic stub thì vẫn hiển thị, không redirect
          if (!isBasicStub) {
            toast.error("Không tìm thấy thông tin chi tiết bệnh lý này.");
            navigate("/search");
          }
        })
        .finally(() => setLoading(false));
    } else if (!stateDetail) {
      toast.error("Không tìm thấy chi tiết bệnh.");
      navigate("/search");
    } else {
      setLoading(false);
    }
  }, [id, navigate, toast, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12 text-slate-500">
        Không có dữ liệu chi tiết bệnh.
      </div>
    );
  }

  const generatePDF = async () => {
    if (!reportRef.current) return;
    toast.info("Đang tạo tệp PDF báo cáo bệnh án...");
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Bao_cao_benh_an_${detail.name}.pdf`);
      toast.success("Tải báo cáo PDF thành công!");
    } catch (err) {
      console.error("Lỗi tạo PDF:", err);
      toast.error("Không thể tạo báo cáo PDF. Vui lòng thử lại.");
    }
  };

  const tabs = [
    { id: "overview", label: "Triệu chứng & Nguyên nhân", icon: <Heart className="h-4 w-4" /> },
    { id: "diagnosis", label: "Chẩn đoán & Điều trị", icon: <Stethoscope className="h-4 w-4" /> },
    { id: "doctors", label: "Bác sĩ & Phòng khám", icon: <Activity className="h-4 w-4" /> },
    { id: "precaution", label: "Phòng ngừa", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin chi tiết bệnh</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            {detail.name_vi || detail.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate("/booking", {
              state: {
                diseaseId: detail.id || id,
                diseaseName: detail.name_vi || detail.name,
                department: detail.departments || detail.department
              }
            })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Stethoscope className="h-4.5 w-4.5" />
            <span>Đặt lịch khám (10km)</span>
          </button>
          
          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Tải báo cáo PDF</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Tổng quan bệnh học
              </h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-sm md:text-base">
                {detail.overview_vi || detail.overview || "Không có thông tin tổng quan."}
              </p>


              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-xl border border-sky-200/60 dark:border-sky-800/60 text-xs font-semibold shadow-sm">
                <span>📚 Nguồn tham khảo y khoa:</span>
                <a
                  href={
                    detail.wikipedia?.url ||
                    `https://vi.wikipedia.org/wiki/${encodeURIComponent(detail.name_vi || detail.name)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline hover:text-sky-600 dark:hover:text-sky-200 transition-colors flex items-center gap-1"
                >
                  Wikipedia tiếng Việt ({detail.wikipedia?.title || detail.name_vi || detail.name}) →
                </a>
              </div>

            </div>

            <hr className="border-slate-150 dark:border-slate-800" />

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Triệu chứng lâm sàng
              </h2>
              {Array.isArray(detail.symptoms) && detail.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {detail.symptoms.map((symptom: any, idx) => {
                    const isObject = typeof symptom === 'object' && symptom !== null;
                    const symName = isObject ? symptom.name : symptom;

                    return isObject ? (
                      <Link
                        key={symptom.id}
                        to={`/symptom/${symptom.id}`}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-light text-slate-700 dark:text-slate-200 border hover:border-primary rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>{symName}</span>
                        <span className="text-[10px] opacity-60 font-bold">&rarr;</span>
                      </Link>
                    ) : (
                      <span
                        key={idx}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border rounded-xl text-sm font-semibold"
                      >
                        {symName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Không có thông tin triệu chứng.</p>
              )}
            </div>

            <hr className="border-slate-150 dark:border-slate-800" />

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Nguyên nhân gây bệnh
              </h2>
              <ListField value={detail.causes} vi={detail.causes_vi} />
              {!detail.causes_vi && !detail.causes && (
                <p className="text-sm text-slate-400">Không có thông tin nguyên nhân.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "diagnosis" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Phương pháp chẩn đoán
              </h2>
              <ListField value={detail.diagnosis} vi={detail.diagnosis_vi} />
              {!detail.diagnosis_vi && !detail.diagnosis && (
                <p className="text-sm text-slate-400">Không có thông tin chẩn đoán.</p>
              )}
            </div>

            <hr className="border-slate-150 dark:border-slate-800" />

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Hướng điều trị y khoa
              </h2>
              <ListField value={detail.treatment} vi={detail.treatment_vi} />
              {!detail.treatment_vi && !detail.treatment && (
                <p className="text-sm text-slate-400">Không có thông tin điều trị.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-primary">•</span> Chuyên khoa thăm khám khuyên dùng
              </h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-sm mb-4">
                Để nhận được chẩn đoán và điều trị chính xác nhất cho tình trạng này, bạn nên ưu tiên thăm khám tại các chuyên khoa y tế sau:
              </p>
              
              <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl mb-6 border border-slate-250/20 dark:border-slate-800">
                <ul className="list-disc pl-5 text-sm font-bold text-slate-700 dark:text-slate-300 space-y-2">
                  {detail.department || detail.departments ? (
                    (detail.departments || detail.department || "")
                      .split(/[\/,;\n]+/)
                      .map((d: string) => d.trim())
                      .filter(Boolean)
                      .map((dept: string, idx: number) => (
                        <li key={idx} className="hover:text-primary transition-colors">{dept}</li>
                      ))
                  ) : (
                    <>
                      <li>Nội tổng quát</li>
                      <li>Khoa Nội nhiễm / Bệnh nhiệt đới</li>
                      <li>Các chuyên khoa liên quan theo chỉ định</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  💡 Hướng dẫn & Lưu ý khi đi khám bác sĩ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-500/5 dark:bg-sky-500/10 rounded-xl border border-sky-500/10">
                    <h4 className="text-xs font-bold text-sky-700 dark:text-sky-400 mb-1">Khi nào cần nhập viện ngay?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hãy đến cơ sở y tế khẩn cấp nếu xuất hiện dấu hiệu nguy kịch: sốt cao liên tục không giảm khi dùng thuốc, khó thở, co giật, hoặc phát ban lan rộng toàn thân kèm theo mệt mỏi cực độ.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Cần chuẩn bị gì trước khi khám?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Ghi lại toàn bộ danh sách các loại thuốc, thực phẩm chức năng đang dùng gần đây, cũng như lịch sử dị ứng thuốc và thực phẩm để cung cấp đầy đủ thông tin cho bác sĩ điều trị.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "precaution" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Phòng chống & Biện pháp ngừa bệnh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.precautions ? (
                (Array.isArray(detail.precautions) ? detail.precautions : String(detail.precautions).split("\n")).map((p, idx) => {
                  const cleaned = String(p).replace(/^\d+\.\s*/, '').trim();
                  if (!cleaned) return null;
                  return (
                    <div
                      key={idx}
                      className={`p-5 border-l-4 rounded-xl ${
                        idx === 0
                          ? "bg-sky-50/50 dark:bg-sky-950/10 border-sky-500"
                          : idx === 1
                          ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500"
                          : idx === 2
                          ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500"
                          : "bg-purple-50/50 dark:bg-purple-950/10 border-purple-500"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {cleaned}
                      </p>
                    </div>
                  );
                }).filter(Boolean)
              ) : detail.Precaution_vi ? (
                (Array.isArray(detail.Precaution_vi) ? detail.Precaution_vi : String(detail.Precaution_vi).split(",")).map((p, idx) => (
                  <div
                    key={idx}
                    className={`p-5 border-l-4 rounded-xl ${
                      idx === 0
                        ? "bg-sky-50/50 dark:bg-sky-950/10 border-sky-500"
                        : idx === 1
                        ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500"
                        : idx === 2
                        ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500"
                        : "bg-purple-50/50 dark:bg-purple-950/10 border-purple-500"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {String(p).trim()}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  {detail.Precaution_1 && (
                    <div className="p-5 bg-sky-50/50 dark:bg-sky-950/10 border-l-4 border-sky-500 rounded-xl">
                      <p className="text-sm font-semibold text-sky-900 dark:text-sky-300 leading-relaxed">
                        {detail.Precaution_1}
                      </p>
                    </div>
                  )}
                  {detail.Precaution_2 && (
                    <div className="p-5 bg-amber-50/50 dark:bg-amber-950/10 border-l-4 border-amber-500 rounded-xl">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 leading-relaxed">
                        {detail.Precaution_2}
                      </p>
                    </div>
                  )}
                  {detail.Precaution_3 && (
                    <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/10 border-l-4 border-emerald-500 rounded-xl">
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 leading-relaxed">
                        {detail.Precaution_3}
                      </p>
                    </div>
                  )}
                  {detail.Precaution_4 && (
                    <div className="p-5 bg-purple-50/50 dark:bg-purple-950/10 border-l-4 border-purple-500 rounded-xl">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 leading-relaxed">
                        {detail.Precaution_4}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {!detail.precautions && !detail.Precaution_vi && !detail.Precaution_1 && !detail.Precaution_2 && !detail.Precaution_3 && !detail.Precaution_4 && (
              <p className="text-sm text-slate-400 text-center py-6">Không có thông tin phòng chống.</p>
            )}
          </div>
        )}
      </div>

      {/* HIDDEN REPORT FOR PDF GENERATOR */}
      <div
        ref={reportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "210mm",
          padding: "24px",
          background: "#fff",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "12px",
          color: "#1e293b",
          lineHeight: "1.6",
        }}
      >
        {/* PDF Header */}
        <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "2px solid #0B6B8C", paddingBottom: "16px" }}>
          <h1 style={{ margin: "0 0 6px 0", color: "#0B6B8C", fontSize: "24px", fontWeight: "bold" }}>
            BÁO CÁO BỆNH ÁN ĐIỆN TỬ
          </h1>
          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "11px", fontWeight: "medium" }}>
            Ngày lập: {new Date().toLocaleDateString("vi-VN")}
          </p>
          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "11px", fontWeight: "medium" }}>
            Healthcare Predict Predictor System
          </p>
        </div>

        {/* Diagnosis Card */}
        <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f9ff", borderRadius: "12px", borderLeft: "4px solid #0B6B8C" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#0B6B8C", fontSize: "16px", fontWeight: "bold" }}>
            BỆNH THÔNG TIN: {detail.name_vi || detail.name}
          </h2>
          <p style={{ margin: "0", color: "#64748b", fontSize: "11px" }}>
            Mã định danh: {detail.disease_id || "Chưa cập nhật"}
          </p>
        </div>

        {/* Overview */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
            TỔNG QUAN Y KHOA
          </h3>
          <p style={{ margin: "0", color: "#334155" }}>
            {detail.overview || "Không có thông tin tổng quan."}
          </p>
        </div>

        {/* Symptoms */}
        {Array.isArray(detail.symptoms) && detail.symptoms.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
              TRIỆU CHỨNG LÂM SÀNG
            </h3>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#334155" }}>
              {detail.symptoms.map((symptom: any, idx) => {
                const symName = typeof symptom === 'object' && symptom !== null ? symptom.name : symptom;
                return (
                  <li key={idx} style={{ marginBottom: "4px", fontWeight: "medium" }}>
                    {symName}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Causes */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
            NGUYÊN NHÂN
          </h3>
          {Array.isArray(detail.causes) ? (
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#334155" }}>
              {detail.causes.map((c, i) => (
                <li key={i} style={{ marginBottom: "4px", fontWeight: "medium" }}>{c}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "0", color: "#334155" }}>
              {detail.causes_vi || detail.causes || "Không có thông tin nguyên nhân."}
            </p>
          )}
        </div>

        {/* Diagnosis */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
            PHƯƠNG PHÁP CHẨN ĐOÁN
          </h3>
          {Array.isArray(detail.diagnosis) ? (
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#334155" }}>
              {detail.diagnosis.map((d, i) => (
                <li key={i} style={{ marginBottom: "4px", fontWeight: "medium" }}>{d}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "0", color: "#334155" }}>
              {detail.diagnosis_vi || detail.diagnosis || "Không có thông tin chẩn đoán."}
            </p>
          )}
        </div>

        {/* Treatment */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
            HƯỚNG ĐIỀU TRỊ KHUYÊN DÙNG
          </h3>
          {Array.isArray(detail.treatment) ? (
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#334155" }}>
              {detail.treatment.map((t, i) => (
                <li key={i} style={{ marginBottom: "4px", fontWeight: "medium" }}>{t}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "0", color: "#334155" }}>
              {detail.treatment_vi || detail.treatment || "Không có thông tin điều trị."}
            </p>
          )}
        </div>

        {/* Clinic recommended */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
            KHOA ĐIỀU TRỊ CHUYÊN MÔN
          </h3>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#334155" }}>
            {detail.department ? (
              <li style={{ fontWeight: "medium" }}>{detail.department}</li>
            ) : (
              <>
                <li style={{ fontWeight: "medium" }}>Nội tổng quát</li>
                <li style={{ fontWeight: "medium" }}>Nội nhiễm / Bệnh nhiệt đới</li>
              </>
            )}
          </ul>
        </div>

        {/* Precautions */}
        {(detail.precautions || detail.Precaution_1 || detail.Precaution_2 || detail.Precaution_3 || detail.Precaution_4) && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#0B6B8C", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "8px" }}>
              BIỆN PHÁP PHÒNG NGỪA Y TẾ
            </h3>
            <div style={{ color: "#334155" }}>
              {detail.precautions ? (
                (Array.isArray(detail.precautions) ? detail.precautions : String(detail.precautions).split("\n")).map((p, idx) => {
                  const cleaned = String(p).replace(/^\d+\.\s*/, '').trim();
                  return cleaned ? <p key={idx} style={{ margin: "8px 0" }}>• {cleaned}</p> : null;
                }).filter(Boolean)
              ) : (
                <>
                  {detail.Precaution_1 && <p style={{ margin: "8px 0" }}>• {detail.Precaution_1}</p>}
                  {detail.Precaution_2 && <p style={{ margin: "8px 0" }}>• {detail.Precaution_2}</p>}
                  {detail.Precaution_3 && <p style={{ margin: "8px 0" }}>• {detail.Precaution_3}</p>}
                  {detail.Precaution_4 && <p style={{ margin: "8px 0" }}>• {detail.Precaution_4}</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* PDF Footer */}
        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "2px solid #0B6B8C", textAlign: "center", color: "#94a3b8", fontSize: "10px" }}>
          <p style={{ margin: "0" }}>Healthcare Predict - Bảo cáo thông tin y khoa cá nhân hóa</p>
          <p style={{ margin: "4px 0 0 0" }}>Báo cáo tự động được xây dựng trực tuyến</p>
        </div>
      </div>
    </div>
  );
}
