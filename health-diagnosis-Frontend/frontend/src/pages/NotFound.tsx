import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      {/* 404 Illustration / Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150"></div>
        <div className="relative h-24 w-24 md:h-32 md:w-32 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-primary text-primary mx-auto animate-pulse">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200">
          Không tìm thấy trang
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại địa chỉ URL hoặc quay về trang chủ.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="font-bold flex items-center gap-2"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Quay lại</span>
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="bg-primary hover:bg-primary-dark text-white font-bold flex items-center gap-2"
        >
          <Home className="h-4.5 w-4.5" />
          <span>Về trang chủ</span>
        </Button>
      </div>
    </div>
  );
}
