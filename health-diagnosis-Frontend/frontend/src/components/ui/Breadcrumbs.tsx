import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const routeMap: Record<string, string> = {
    predict: "Chẩn đoán bệnh",
    contact: "Liên hệ",
    hospital: "Đề xuất bệnh viện",
    profile: "Profile",
    "search-history": "Lịch sử tìm kiếm",
    "predict-history": "Lịch sử chẩn đoán",
    login: "Đăng nhập",
    signup: "Đăng ký",
    forgot: "Quên mật khẩu",
    reset: "Đặt lại mật khẩu",
  };

  const getBreadcrumbName = (path: string, index: number) => {
    if (index > 0 && pathnames[index - 1] === "disease") {
      return "Chi tiết bệnh";
    }
    return routeMap[path] || path;
  };

  if (location.pathname === "/" || location.pathname === "/home") {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-primary transition-colors text-slate-600 dark:text-slate-300"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Trang chủ</span>
      </Link>

      {pathnames.map((value, index) => {
        if (value === "disease") return null;

        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const name = getBreadcrumbName(value, index);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
            {isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-bold max-w-[180px] truncate">
                {name}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-primary transition-colors text-slate-600 dark:text-slate-350"
              >
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
