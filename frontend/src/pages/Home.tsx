import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search as SearchIcon, ChevronRight, Activity, BookOpen, AlertTriangle, Lightbulb, Sparkles, Lock, ExternalLink, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { searchDiseases, getDiseaseDetailFromDiseases } from "../api/diseases";
import { saveLocalSearchHistory } from "../api/history";
import { getDailyDashboardData } from "../api/dashboard";
import { getRequest, postRequest } from "../api/client";
import Modal from "../components/ui/Modal";
import GlobalHealthDashboard from "../components/GlobalHealthDashboard";

interface Disease {
  id?: string | number;
  _id?: string | number;
  name: string;
}

export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dailyTip, setDailyTip] = useState("Uống đủ từ 1.5 - 2 lít nước mỗi ngày giúp giảm các triệu chứng mệt mỏi và đau đầu hiệu quả.");
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesRefreshing, setArticlesRefreshing] = useState(false);

  async function loadArticles() {
    setArticlesLoading(true);
    try {
      const res = await getRequest('/api/news?limit=5');
      if (res?.data && res.data.length > 0) {
        setArticles(res.data);
      } else {
        const dash = await getDailyDashboardData();
        if (dash?.articles?.length > 0) {
          setArticles(dash.articles.map((a: any) => ({
            title: a.title,
            description: a.desc || a.description,
            url: a.url,
            source: a.source || 'Y tế',
          })));
        }
      }
    } catch (err) {
      console.warn('Failed to load news:', err);
    } finally {
      setArticlesLoading(false);
    }
  }

  async function refreshArticles() {
    setArticlesRefreshing(true);
    try {
      // Gọi POST force refresh rồi load lại
      await postRequest('/api/news/refresh').catch(() => {});
      await loadArticles();
    } finally {
      setArticlesRefreshing(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    async function loadDailyTip() {
      try {
        const res = await getDailyDashboardData();
        if (res?.ok && res.healthTip) setDailyTip(res.healthTip);
      } catch (err) {
        console.warn('Failed to load daily tip:', err);
      }
    }
    loadDailyTip();
  }, []);

  const [greeting] = useState(() => {
    const msgs = [
      "Hệ thống Hỗ trợ Chẩn đoán & Tra cứu Y khoa Thông minh",
      "Chào mừng bạn — Hãy để chúng tôi đồng hành cùng sức khỏe của bạn",
      "Vì một cuộc sống khỏe mạnh — Bắt đầu đánh giá sức khỏe trực tuyến",
      "Sức khỏe của bạn là ưu tiên hàng đầu — Nhận tư vấn y tế nhanh chóng",
      "Công cụ Hỗ trợ Phân tích Triệu chứng & Tra cứu Bệnh lý Đáng tin cậy",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  });

  function handleSelectDisease(diseaseId: string, diseaseName: string) {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    async function fetchAndNavigate() {
      try {
        try {
          saveLocalSearchHistory({
            type: "search",
            searchName: diseaseName,
            diseaseName: diseaseName,
            result: [],
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Failed to save local search history on select", e);
        }
        const detail = await getDiseaseDetailFromDiseases(diseaseId);
        localStorage.setItem("disease_detail", JSON.stringify(detail));
        navigate(`/disease/${diseaseId}`, { state: { detail } });
      } catch (err) {
        console.error("Error fetching disease detail:", err);
        toast.error("Lỗi khi tải chi tiết bệnh. Vui lòng thử lại.");
      }
    }

    fetchAndNavigate();
  }

  async function handlePopularDiseaseClick(diseaseName: string) {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    try {
      const searchResult = await searchDiseases(diseaseName);
      if (searchResult && searchResult.data && searchResult.data.length > 0) {
        const match = searchResult.data[0];
        handleSelectDisease(match.id || match._id, match.name);
      } else {
        toast.error("Không tìm thấy thông tin cho bệnh này.");
      }
    } catch (err) {
      console.error("Error fetching popular disease:", err);
      toast.error("Lỗi kết nối máy chủ.");
    }
  }

  const popularDiseases = [
    "Cúm",
    "Sốt xuất huyết",
    "COVID-19",
    "Đái tháo đường",
    "Huyết áp cao",
    "Viêm dạ dày",
    "Hen suyễn",
    "Dị ứng",
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 p-6 md:p-8 rounded-3xl border border-cyan-100/50 dark:border-slate-800 transition-colors duration-300">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100/80 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 text-xs font-bold rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Healthcare Assistant</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4.5xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            {greeting}
          </h1>
          <p className="text-slate-600 dark:text-slate-350 text-sm md:text-base leading-relaxed">
            Đánh giá sơ bộ triệu chứng lâm sàng và cung cấp thông tin y học chính xác hỗ trợ bạn tự chăm sóc sức khỏe chủ động.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate("/predict")}
              className="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Bắt đầu kiểm tra triệu chứng →
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setShowAuthModal(true);
                } else {
                  navigate("/search");
                }
              }}
              className="px-5 py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all duration-200"
            >
              Tra cứu thông tin bệnh lý
            </button>
          </div>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-white/20">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=740&auto=format&fit=crop"
              alt="Doctor illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Most searched & Articles */}
        <div className="lg:col-span-2 space-y-8">
          {/* Most Searched Diseases */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Bệnh phổ biến được tìm kiếm nhiều nhất
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {popularDiseases.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handlePopularDiseaseClick(d)}
                  className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/10 dark:hover:bg-primary/20 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light font-medium rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          {/* Medical Articles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Bài viết y học mới nhất
              </h2>
              <button
                onClick={refreshArticles}
                disabled={articlesRefreshing || articlesLoading}
                title="Làm mới bài báo"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${articlesRefreshing ? 'animate-spin' : ''}`} />
                {articlesRefreshing ? 'Đang cập nhật...' : 'Làm mới'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {articlesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full mb-1"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                  </div>
                ))
              ) : articles.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4 col-span-3">Không có bài viết mới.</p>
              ) : (
                articles.slice(0, 3).map((a, idx) => (
                  <article key={a.id || idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                          {a.source || 'Y tế'}
                        </span>
                        {a.published_at && (
                          <span className="text-[9px] text-slate-400">
                            {new Date(a.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm leading-snug line-clamp-2">
                        🩺 {a.title}
                      </h3>
                      {(a.description || a.desc) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                          {a.description || a.desc}
                        </p>
                      )}
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark transition-colors self-start"
                    >
                      Đọc tiếp <ExternalLink className="h-3 w-3" />
                    </a>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (1/3): Emergency guide & Tips */}
        <div className="space-y-6">
          {/* Emergency Guide */}
          <section className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-rose-800 dark:text-rose-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo khẩn cấp
            </h2>
            <ul className="space-y-2.5 text-sm text-rose-700 dark:text-rose-350 font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                Đau ngực, đau lan ra vai hoặc cổ
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                Khó thở đột ngột hoặc thở dốc kéo dài
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                Nôn ra máu hoặc đại tiện ra máu
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                Mất ý thức, lơ mơ hoặc co giật
              </li>
            </ul>
          </section>

          {/* Medical Tip */}
          <section className="bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Lời khuyên sức khỏe
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-350 leading-relaxed font-semibold">
              {dailyTip}
            </p>
          </section>
        </div>
      </div>

      {/* Global Health Dashboard - Full Width at bottom */}
      <div className="pt-4">
        <GlobalHealthDashboard />
      </div>

      {/* Auth Required Modal */}
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
    </div>
  );
}
