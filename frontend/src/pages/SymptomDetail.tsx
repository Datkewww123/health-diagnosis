import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSymptomDetail } from "../api/diseases";
import { useToast } from "../context/ToastContext";
import { Loader2, ArrowLeft, HeartPulse, Activity } from "lucide-react";

interface AssociatedDisease {
  id: number;
  name: string;
}

interface SymptomData {
  id: number;
  name: string;
  description: string;
  diseases: AssociatedDisease[];
}

export default function SymptomDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [symptom, setSymptom] = useState<SymptomData | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function loadSymptom() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getSymptomDetail(id);
        if (res) {
          setSymptom(res);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Không thể tải chi tiết triệu chứng y tế.");
      } finally {
        setLoading(false);
      }
    }
    loadSymptom();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Đang tải dữ liệu y tế...</span>
      </div>
    );
  }

  if (!symptom) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-card rounded-lg shadow text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-muted-foreground mb-4">Không tìm thấy triệu chứng y tế yêu cầu.</p>
        <Link to="/" className="inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Link to={-1 as any} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang trước
      </Link>

      <div className="bg-card rounded-xl border p-6 md:p-8 shadow-sm">
        {/* Tiêu đề triệu chứng */}
        <div className="flex items-center space-y-0 space-x-4 mb-6">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-500">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs text-red-500 font-semibold tracking-wider uppercase">Triệu chứng lâm sàng</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">{symptom.name}</h1>
          </div>
        </div>

        {/* Nội dung mô tả */}
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
              <span>🩺 Mô tả & Cách sơ cứu ban đầu</span>
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border text-muted-foreground leading-relaxed whitespace-pre-line">
              {symptom.description || "Chưa có thông tin mô tả chi tiết cho triệu chứng này."}
            </div>
          </div>

          {/* Các bệnh liên quan */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
              <HeartPulse className="w-5 h-5 text-primary" />
              <span>Các bệnh lý có thể đi kèm triệu chứng này</span>
            </h2>
            
            {symptom.diseases && symptom.diseases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {symptom.diseases.map((d) => (
                  <Link
                    key={d.id}
                    to={`/disease/${d.id}`}
                    className="flex items-center justify-between p-4 bg-background border hover:border-primary hover:shadow-sm rounded-lg group transition-all"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {d.name}
                    </span>
                    <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Chi tiết &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">Chưa ghi nhận bệnh lý nào liên quan trong danh mục.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
