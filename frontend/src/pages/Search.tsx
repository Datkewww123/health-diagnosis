import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search as SearchIcon, ChevronRight, FileText, Activity, Lock } from "lucide-react";
import { searchDiseases, getDiseaseDetailFromDiseases, getDiseaseSuggestions } from "../api/diseases";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import Modal from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";

import { saveLocalSearchHistory } from "../api/history";

interface Disease {
  id?: string | number;
  _id?: string | number;
  name: string;
}

export default function Search() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Suggestions from database
  const [allDiseases, setAllDiseases] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch toàn bộ tên bệnh từ database khi component mount
  useEffect(() => {
    getDiseaseSuggestions()
      .then((list) => setAllDiseases(list.map((d) => d.name)))
      .catch(() => setAllDiseases([]));
  }, []);

  const filteredSuggestions = searchQuery.trim()
    ? allDiseases.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase()) &&
        item.toLowerCase() !== searchQuery.toLowerCase()
      ).slice(0, 15)
    : [];

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function triggerSearch(query: string) {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const data = await searchDiseases(query);
      if (!data || data.count === 0) {
        setError("Không tìm thấy bệnh phù hợp. Vui lòng thử từ khóa khác.");
        setResults([]);
      } else {
        setResults(data.data || []);
      }
    } catch (err: any) {
      console.error("[Search] error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tìm kiếm.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError("Vui lòng nhập tên bệnh bạn muốn tìm!");
      setResults([]);
      return;
    }
    setShowSuggestions(false);
    triggerSearch(query);
  }

  function selectSuggestion(val: string) {
    setSearchQuery(val);
    setShowSuggestions(false);
    triggerSearch(val);
  }

  async function viewDetail(diseaseId: string, diseaseName: string) {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    // Chỉ lưu vào lịch sử tìm kiếm khi bấm xem chi tiết
    try {
      saveLocalSearchHistory({
        type: "search",
        searchName: searchQuery.trim() || diseaseName,
        diseaseName: diseaseName,
        result: results,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to save search history on view detail", e);
    }

    // Navigate ngay với info cơ bản — DiseaseDetail sẽ tự fetch thêm chi tiết
    const basicState = { detail: { id: diseaseId, name: diseaseName, name_vi: diseaseName } };
    navigate(`/disease/${diseaseId}`, { state: basicState });
  }

  return (
    <><div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <SearchIcon className="h-7 w-7 text-primary" />
          Tra cứu thông tin bệnh lý
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Tìm kiếm thông tin triệu chứng, tác nhân, phòng ngừa và điều trị từ cơ sở dữ liệu y khoa
        </p>
      </div>

      {/* Search Bar Form */}
      <Card className="p-4 md:p-6 shadow-md border border-slate-200 dark:border-slate-800 overflow-visible">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div ref={suggestionsRef} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Nhập tên bệnh lý cần tra cứu (ví dụ: Cúm, Sốt xuất huyết...)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

            {/* Auto-complete suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 animate-slide-down">
                {filteredSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2"
                  >
                    <SearchIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="px-6 h-11 shrink-0 font-bold text-sm bg-primary hover:bg-primary-dark text-white rounded-xl shadow-sm hover:shadow transition-all"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-1"></span>
            ) : null}
            <span>{loading ? "Đang tìm..." : "Tìm kiếm"}</span>
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30">
            {error}
          </div>
        )}
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {results.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Kết quả tìm kiếm ({results.length})
            </h2>
          </div>
        )}

        <div className="grid gap-3">
          {results.map((disease) => {
            const diseaseId = String(disease.id || disease._id);
            return (
              <Card
                key={diseaseId}
                onClick={() => viewDetail(diseaseId, disease.name)}
                className="p-5 flex items-center justify-between hover:shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all duration-205 group"
              >
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-primary dark:text-primary-light group-hover:text-primary-dark transition-colors flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-slate-450 dark:text-slate-500" />
                    {disease.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    Mã bệnh: {diseaseId}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all flex items-center gap-1 font-bold text-xs"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>

        {results.length === 0 && !loading && !error && (
          <EmptyState
            title="Bắt đầu tìm kiếm"
            description="Hãy nhập tên bệnh lý vào ô tìm kiếm ở trên để khám phá thông tin chi tiết."
          />
        )}
      </div>
    </div>

      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Yêu cầu đăng nhập"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setShowAuthModal(false); navigate("/login"); }}
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
            Bạn cần đăng nhập để sử dụng tính năng này
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vui lòng đăng nhập hoặc tạo tài khoản mới để xem chi tiết bệnh và các tính năng khác.
          </p>
        </div>
      </Modal>
  </>);
}
