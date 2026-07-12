import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageSquare, Mic, Send, AlertTriangle, FileText, X, Check, Activity, Search, Award, Lock, Stethoscope } from "lucide-react";
import { predictSymptoms, getSymptomsList } from "../api/symptoms";
import { getDiseaseDetailFromDiseases, searchDiseases } from "../api/diseases";
import { saveLocalPredictHistory } from "../api/history";
import { useToast } from "../context/ToastContext";
import Modal from "../components/ui/Modal";

interface DiseaseResult {
  id?: number | string;
  name: string;
  name_vi?: string;
  score: number;
  matched?: string[];
  departments?: string;
  department?: string;
  _id?: string;
}

interface PredictResult {
  count: number;
  data: DiseaseResult[];
}

export default function Predict() {
  const navigate = useNavigate();
  const toast = useToast();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const predictAbortRef = useRef<AbortController | null>(null);

  // Phân trang kết quả
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Khôi phục kết quả cũ từ sessionStorage khi quay lại từ disease detail
  useEffect(() => {
    const saved = sessionStorage.getItem("__predict_state");
    if (saved) {
      try {
        const { savedInput, savedResult, savedPage } = JSON.parse(saved);
        if (savedInput) setInput(savedInput);
        if (savedResult) setResult(savedResult);
        if (savedPage) setCurrentPage(savedPage);
      } catch { /* ignore */ }
    }
  }, []);

  // State cho Voice-to-Text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionBaseRef = useRef("");

  // State cho Auth Modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [commonSymptoms, setCommonSymptoms] = useState<string[]>([
    "Sốt cao",
    "Ho khan",
    "Đau họng",
    "Phát ban",
    "Đau thượng vị",
    "Buồn nôn",
    "Khó thở",
    "Đau đầu",
    "Mệt mỏi",
    "Chóng mặt",
    "Đau ngực",
    "Tiêu chảy",
    "Đau bụng",
    "Đau khớp",
    "Đau lưng",
    "Mất ngủ",
    "Chán ăn",
    "Sụt cân",
    "Tăng cân",
    "Khát nước",
    "Tiểu nhiều",
    "Tiểu buốt",
    "Hồi hộp",
    "Ù tai",
    "Mờ mắt",
    "Vàng da",
    "Nước tiểu sẫm",
    "Ngứa da",
    "Ho có đờm",
    "Khò khè",
    "Nghẹt mũi",
    "Chảy nước mũi",
    "Ớn lạnh",
    "Vã mồ hôi",
    "Tê bì",
    "Đau nhức xương",
    "Cứng khớp sáng",
    "Đau cơ",
    "Đau hạ sườn phải",
    "Da khô",
    "Rụng tóc",
    "Đau sau xương ức",
    "Ợ chua",
    "Cổ trướng",
    "Xuất huyết dưới da"
  ]);

  useEffect(() => {
    async function fetchSymptoms() {
      try {
        const res = await getSymptomsList();
        if (res && res.ok && Array.isArray(res.data)) {
          const dbNames = res.data.map((item: any) => item.name).filter(Boolean);
          if (dbNames.length > 0) {
            // Merge: giữ gợi ý mặc định + thêm từ DB (không trùng)
            setCommonSymptoms(prev => {
              const merged = [...prev];
              for (const name of dbNames) {
                if (!merged.some(s => s.toLowerCase() === name.toLowerCase())) {
                  merged.push(name);
                }
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn("Failed to load symptoms list from DB:", err);
      }
    }
    fetchSymptoms();
  }, []);

  const handleAddSymptom = (symptom: string) => {
    const currentInput = input.trim();
    if (!currentInput) {
      setInput(symptom);
      return;
    }

    // Tách input thành mảng bằng dấu phẩy
    const symptomsList = currentInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Kiểm tra xem triệu chứng đã có trong mảng chưa (không phân biệt hoa thường)
    const existsIdx = symptomsList.findIndex(
      (s) => s.toLowerCase() === symptom.toLowerCase()
    );

    if (existsIdx > -1) {
      // Nếu đã tồn tại -> Nhấn lần nữa để BỎ CHỌN (xóa khỏi mảng)
      symptomsList.splice(existsIdx, 1);
    } else {
      // Nếu chưa tồn tại -> Nhấn 1 lần để CHỌN (thêm vào mảng)
      symptomsList.push(symptom);
    }

    // Ghép lại thành chuỗi phân cách bởi dấu phẩy
    setInput(symptomsList.join(", "));
  };

  const inputRef = useRef(input);
  inputRef.current = input;

  // Khởi tạo Web Speech API khi component mount
  const isListeningRef = useRef(false);

  const initRecognition = () => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionBaseRef.current = typeof inputRef.current === "string" ? inputRef.current : "";
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        recognitionBaseRef.current =
          (recognitionBaseRef.current + " " + finalTranscript).trim() + " ";
        setInput(recognitionBaseRef.current);
      } else {
        setInput((recognitionBaseRef.current + interimTranscript).trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "aborted") {
        return;
      }
      if (event.error === "network") {
        toast.error("Không thể kết nối đến máy chủ nhận dạng giọng nói. Vui lòng kiểm tra kết nối Internet hoặc thử nhập trực tiếp.");
      } else if (event.error === "not-allowed") {
        toast.error("Quyền truy cập micro bị từ chối. Vui lòng cấp quyền sử dụng micro trong cài đặt trình duyệt.");
      } else if (event.error === "no-speech") {
        toast.warning("Không nghe thấy giọng nói. Vui lòng nói to rõ hơn.");
      } else if (event.error === "audio-capture") {
        toast.error("Không tìm thấy micro. Vui lòng kiểm tra thiết bị micro của bạn.");
      } else if (event.error === "service-not-allowed") {
        toast.error("Dịch vụ nhận dạng giọng nói không khả dụng trên trình duyệt này.");
      } else {
        toast.error(`Lỗi nhận dạng giọng nói: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;
  };

  useEffect(() => {
    initRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [toast]);

  async function handleFindIdAndView(diseaseObj: DiseaseResult) {
    setViewLoading(true);
    try {
      let finalId = diseaseObj.id || diseaseObj._id;

      if (!finalId) {
        const nameToSearch = diseaseObj.name_vi || diseaseObj.name;
        const searchResult = await searchDiseases(nameToSearch);
        if (searchResult && searchResult.data && searchResult.data.length > 0) {
          finalId = searchResult.data[0].id || searchResult.data[0]._id;
        }
      }

      if (!finalId) {
        toast.error("Không tìm thấy thông tin chi tiết cho bệnh này.");
        setViewLoading(false);
        return;
      }

      try {
        const detail = await getDiseaseDetailFromDiseases(String(finalId));
        // Lưu lại state hiện tại trước khi sang trang chi tiết
        sessionStorage.setItem("__predict_state", JSON.stringify({
          savedInput: input,
          savedResult: result,
          savedPage: currentPage
        }));
        // Chỉ lưu bệnh người dùng đã chọn (không lưu toàn bộ danh sách)
        try {
          const inputSymptoms = input.trim().split(",").map(s => s.trim()).filter(Boolean);
          saveLocalPredictHistory({
            type: "predict",
            inputSymptoms,
            result: [diseaseObj],
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("[Predict] Failed to save predict history:", e);
        }
        navigate(`/disease/${finalId}`, { state: { detail } });
      } catch (e) {
        // Fallback state nếu không thể tải từ server
        const fallbackDetail = {
          id: finalId,
          name: diseaseObj.name_vi || diseaseObj.name,
          name_vi: diseaseObj.name_vi || diseaseObj.name,
          overview: "Thông tin chẩn đoán y khoa từ cơ sở dữ liệu chuẩn quốc tế WHO ICD-11.",
          causes: "Bệnh lý được xác định và ghi nhận trong hệ thống WHO ICD-11.",
          diagnosis: "Chẩn đoán lâm sàng theo tiêu chuẩn WHO.",
          treatment: "Điều trị theo chỉ định của bác sĩ chuyên khoa.",
          precautions: "Phòng ngừa theo khuyến cáo y tế.",
          departments: diseaseObj.departments || diseaseObj.department || "Nội tổng quát"
        };
        // Lưu history ngay cả khi fallback
        try {
          const inputSymptoms = input.trim().split(",").map(s => s.trim()).filter(Boolean);
          saveLocalPredictHistory({
            type: "predict",
            inputSymptoms,
            result: [diseaseObj],
            createdAt: new Date().toISOString(),
          });
        } catch { /* ignore */ }
        navigate(`/disease/${finalId}`, { state: { detail: fallbackDetail } });
      }
    } catch (err) {
      console.error("[Predict] Error finding details:", err);
      toast.error("Lỗi khi tải thông tin bệnh.");
    } finally {
      setViewLoading(false);
    }
  }

  const handleVoiceInput = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast.error(
        "Trình duyệt của bạn không hỗ trợ Voice-to-Text. Vui lòng sử dụng Chrome, Edge hoặc Firefox."
      );
      return;
    }

    if (isListening || isListeningRef.current) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Speech recognition stop error:", e);
      }
      setIsListening(false);
      isListeningRef.current = false;
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Speech recognition start error:", err);
        initRecognition();
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        } catch (e) {
          console.error("Speech recognition retry start error:", e);
          toast.error("Không thể khởi động nhận dạng giọng nói. Vui lòng thử lại sau.");
        }
      }
    }
  };

  async function handleSearch() {
    const query = input.trim();
    if (!query) {
      toast.warning("Vui lòng nhập hoặc chọn ít nhất một triệu chứng!");
      return;
    }

    if (predictAbortRef.current) {
      predictAbortRef.current.abort();
    }
    const controller = new AbortController();
    predictAbortRef.current = controller;

    sessionStorage.removeItem("__predict_state");
    setLoading(true);
    setResult(null);
    setCurrentPage(1);

    try {
      const data = await predictSymptoms([query]);
      if (controller.signal.aborted) return;

      if (data && Array.isArray(data.data)) {
        data.data.sort((a: DiseaseResult, b: DiseaseResult) => b.score - a.score);
      }

      setResult(data);
      if (!data || data.count === 0) {
        toast.info("Không tìm thấy bệnh phù hợp với triệu chứng đã nhập.");
      } else {
        toast.success(`Phân tích thành công! Tìm thấy ${data.count} kết quả.`);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Predict error:", err);
      toast.error("Đã xảy ra lỗi khi phân tích triệu chứng. Vui lòng thử lại.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {viewLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Đang tải chi tiết bệnh...</span>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="text-center py-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Activity className="h-4 w-4" />
          <span>Công cụ chẩn đoán thông minh</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100">
          Chẩn đoán Triệu chứng Bệnh lý
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Nhập các biểu hiện sức khỏe của bạn bằng ngôn ngữ tự nhiên hoặc chọn từ các gợi ý nhanh để bắt đầu chẩn đoán sơ bộ trực tuyến.
        </p>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-350">
            Bạn đang cảm thấy như thế nào?
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Ví dụ: Tôi bị đau đầu dữ dội, sốt cao kèm theo ho khan và mệt mỏi mấy ngày nay..."
              rows={4}
              className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold resize-none leading-relaxed"
            />
            {input && (
              <button
                onClick={() => setInput("")}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* VOICE INPUT & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <button
            onClick={handleVoiceInput}
            className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${isListening
                ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
          >
            <Mic className="h-5 w-5" />
            <span>{isListening ? "Đang lắng nghe triệu chứng..." : "Nói triệu chứng (Giọng nói)"}</span>
          </button>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Search className="h-4.5 w-4.5" />
            <span>{loading ? "Đang phân tích..." : "Chẩn đoán triệu chứng"}</span>
          </button>
        </div>

        <hr className="border-slate-150 dark:border-slate-850" />

        {/* POPULAR SYMPTOMS SUGGESTIONS */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Gợi ý triệu chứng phổ biến:
          </span>
          <div className="flex flex-wrap gap-2">
            {commonSymptoms.map((symptom, idx) => {
              const isIncluded = input.toLowerCase().includes(symptom.toLowerCase());
              return (
                <button
                  key={idx}
                  onClick={() => handleAddSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isIncluded
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-slate-300"
                    }`}
                >
                  {isIncluded ? "✓ " : "+ "}
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOADING SCANNER */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center space-y-4">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20">
              <Activity className="h-7 w-7 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
              Đang phân tích dữ liệu triệu chứng...
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Hệ thống đang trích xuất từ khóa lâm sàng và đối chiếu với cơ sở dữ liệu y học để đưa ra chẩn đoán chính xác nhất.
            </p>
          </div>
        </div>
      )}

      {/* DIAGNOSIS RESULTS */}
      {result && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Kết quả phân tích triệu chứng
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Dựa trên triệu chứng đã nhập, dưới đây là danh sách bệnh lý có nguy cơ tương thích.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-xs font-bold rounded-full border border-emerald-500/20 self-start sm:self-auto">
              Tìm thấy {result.count} kết quả phù hợp
            </span>
          </div>

          <div className="space-y-4">
            {result.data?.length ? (
              (() => {
                const totalPages = Math.ceil(result.data.length / itemsPerPage);
                const currentItems = result.data.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                );

                return (
                  <div className="space-y-4">
                    {currentItems.map((d, index) => {
                      const maxScore = Math.max(...(result.data || []).map((disease) => disease.score));
                      const isHighestScore = d.score === maxScore && maxScore >= 25;
                      const progressPercent = typeof d.score === 'number' && !isNaN(d.score) ? d.score : 70;

                      // Determine progress color
                      let progressColor = "bg-amber-500";
                      let textColor = "text-amber-600 dark:text-amber-400";
                      let bgColor = "bg-amber-500/10";
                      let borderColor = "border-amber-500/20";
                      let scoreText = "Độ khớp thấp";

                      if (progressPercent >= 50 && progressPercent < 80) {
                        progressColor = "bg-primary";
                        textColor = "text-primary-dark dark:text-primary-light";
                        bgColor = "bg-primary/10";
                        borderColor = "border-primary/20";
                        scoreText = "Độ khớp trung bình";
                      } else if (progressPercent >= 80) {
                        progressColor = "bg-emerald-500";
                        textColor = "text-emerald-600 dark:text-emerald-400";
                        bgColor = "bg-emerald-500/10";
                        borderColor = "border-emerald-500/20";
                        scoreText = "Độ khớp cao";
                      }

                      return (
                        <div
                          key={index}
                          className="p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
                        >
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                                {d.name_vi || d.name}
                              </h4>
                              {isHighestScore && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-extrabold rounded-md border border-rose-500/20">
                                  <Award className="h-3 w-3" />
                                  Nguy cơ cao nhất
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${bgColor} ${textColor} ${borderColor}`}>
                                {scoreText}
                              </span>
                            </div>

                            {/* MATCH SCORE METER */}
                            <div className="space-y-1.5 max-w-md">
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                                <span>Độ tương thích triệu chứng</span>
                                <span className="font-bold text-slate-600 dark:text-slate-350">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progressPercent}%` }}></div>
                              </div>
                            </div>

                            {/* MATCHED SYMPTOMS */}
                            {((d.matched && d.matched.length > 0) || (input && input.trim().length > 0)) && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">
                                  Triệu chứng tương thích:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(d.matched && d.matched.length > 0
                                    ? d.matched
                                    : input.split(',').map(s => s.trim()).filter(Boolean)
                                  ).map((sym, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-350 rounded-lg text-xs font-bold border border-emerald-500/20 flex items-center gap-1 shadow-2xs"
                                    >
                                      <span className="text-emerald-500 font-extrabold">✓</span>
                                      <span>{sym}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                            <button
                              onClick={() => {
                                const token = localStorage.getItem("token");
                                if (!token) {
                                  setShowAuthModal(true);
                                  return;
                                }
                                navigate("/booking", {
                                  state: {
                                    diseaseId: d.id || d._id,
                                    diseaseName: d.name_vi || d.name,
                                    department: d.departments || d.department
                                  }
                                });
                              }}
                              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/10 dark:hover:bg-amber-500 text-white dark:text-amber-400 dark:hover:text-white border border-transparent dark:border-amber-500/20 text-xs font-bold transition-all shadow-sm"
                            >
                              🩺 Đặt lịch khám
                            </button>
                            <button
                              onClick={() => handleFindIdAndView(d)}
                              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                            >
                              Chi tiết bệnh lý
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* THANH PHÂN TRANG 1 2 3 ... */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400">
                          Hiển thị trang <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> / {totalPages} (Tổng {result.count} kết quả phù hợp)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setCurrentPage(prev => Math.max(prev - 1, 1));
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                          >
                            &larr; Trang trước
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                              }}
                              className={`h-8.5 w-8.5 rounded-xl text-xs font-extrabold transition-all ${
                                currentPage === pageNum
                                  ? "bg-primary text-white shadow-md shadow-primary/20"
                                  : "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            onClick={() => {
                              setCurrentPage(prev => Math.min(prev + 1, totalPages));
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                          >
                            Trang sau &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="inline-flex h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bệnh phù hợp</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Vui lòng nhập thêm triệu chứng khác hoặc thử mô tả chi tiết hơn để hệ thống chẩn đoán.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAVE REQUEST MODAL REMOVED */}

      {/* AUTH MODAL */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Yêu cầu đăng nhập"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setShowAuthModal(false);
                navigate("/login");
              }}
              className="flex-1 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md transition-all text-sm"
            >
              Đăng nhập
            </button>
            <Link
              to="/signup"
              onClick={() => setShowAuthModal(false)}
              className="flex-1 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm text-center transition-all"
            >
              Đăng ký
            </Link>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="h-14 w-14 bg-amber-100 dark:bg-amber-950/30 rounded-full flex items-center justify-center">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Bạn cần đăng nhập để sử dụng chức năng này
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vui lòng đăng nhập hoặc tạo tài khoản mới để xem chi tiết bệnh và các tính năng khác.
          </p>
        </div>
      </Modal>
    </div>
  );
}
