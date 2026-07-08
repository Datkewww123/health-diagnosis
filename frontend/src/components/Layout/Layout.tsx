import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  PlusSquare,
  Mail,
  Hospital,
  User,
  LogOut,
  History,
  PhoneCall,
  Lock,
  Calendar,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Breadcrumbs } from "../ui/Breadcrumbs";
import logoImg from "../../Logo/Logo.jpg";
import defaultAvatar from "../../Logo/DefaultAvatar.jpg";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Xóa state chẩn đoán tạm thời nếu người dùng rời khỏi luồng /predict và /disease/*
  useEffect(() => {
    if (location.pathname !== "/predict" && !location.pathname.startsWith("/disease/")) {
      sessionStorage.removeItem("__predict_state");
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const navItems = role === "doctor"
    ? [
        { path: "/doctor/dashboard", label: "Dashboard Bác sĩ", icon: <Activity className="h-5 w-5" /> },
        { path: "/", label: "Trang chủ", icon: <Home className="h-5 w-5" /> },
      ]
    : [
        { path: "/", label: "Trang chủ", icon: <Home className="h-5 w-5" /> },
        { path: "/predict", label: "Chẩn đoán bệnh", icon: <Activity className="h-5 w-5" /> },
        { path: "/search", label: "Tra cứu bệnh lý", icon: <Search className="h-5 w-5" /> },
        ...(role === "admin"
          ? [{ path: "/add-disease", label: "Quản lý bệnh", icon: <PlusSquare className="h-5 w-5" /> }]
          : [{ path: "/contact", label: "Liên hệ", icon: <Mail className="h-5 w-5" /> }]),
        { path: "/hospital", label: "Đề xuất bệnh viện", icon: <Hospital className="h-5 w-5" /> },
      ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-gradient-to-b from-primary via-primary to-primary-dark text-white border-r border-slate-200/10 transition-all duration-300 print:hidden ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-4 bg-primary-dark/40 border-b border-white/10 overflow-hidden shrink-0">
          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-white/20">
            <img src={logoImg} alt="logo" className="h-full w-full object-cover" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-base tracking-wide truncate">
              Healthcare Predict
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Quick Info Widget at Bottom of Sidebar */}
        <div className="border-t border-white/10 p-3 bg-primary-dark/20 flex items-center justify-between gap-1 shrink-0">
          {isLoggedIn && user ? (
            <div
              onClick={() => navigate("/profile")}
              className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200 min-w-0 flex-1 ${
                isCollapsed ? "justify-center" : ""
              }`}
              title="Xem thông tin cá nhân"
            >
              <img
                src={defaultAvatar}
                alt="avatar"
                className="h-8 w-8 rounded-full border border-white/20 shrink-0 object-cover"
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user.First_name} {user.Last_name}
                  </p>
                  <p className="text-[10px] text-white/50 truncate mt-0.5">
                    {role === "doctor" ? "Bác sĩ" : "Người dùng"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => navigate("/login")}
              className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200 min-w-0 flex-1 ${
                isCollapsed ? "justify-center" : ""
              }`}
              title="Đăng nhập tài khoản"
            >
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <User className="h-4 w-4 text-white/80" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white">Đăng nhập</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Bấm đăng nhập</p>
                </div>
              )}
            </div>
          )}

          {/* Inline Collapse Button to save space */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
              title="Thu gọn sidebar"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Show ChevronRight inline when collapsed */}
        {isCollapsed && (
          <div className="p-2 border-t border-white/10 bg-primary-dark/30 flex justify-center shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
              title="Mở rộng sidebar"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTAINER */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 print:pl-0 ${
          isCollapsed ? "pl-16" : "pl-16 md:pl-64"
        }`}
      >
        {/* HEADER */}
        <header className="sticky top-0 right-0 z-20 h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors duration-300 print:hidden">
          {/* Left: Breadcrumbs & Toggle sidebar on small screens */}
          <div className="flex items-center gap-4">
            <Breadcrumbs />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Support hotline */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full border border-rose-100 dark:border-rose-900/30 text-xs font-bold shrink-0">
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Medical Support: 1900 638 563</span>
            </div>

            {/* Dark Mode Switcher */}
            <ThemeToggle />

            {/* User Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-10 w-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800 hover:border-primary-light transition-colors"
              >
                <img src={defaultAvatar} alt="avatar" className="h-full w-full object-cover" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300 transform origin-top-right transition-all">
                  {isLoggedIn && user ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                        <div className="font-bold text-slate-850 dark:text-slate-150 truncate">
                          {user.First_name} {user.Last_name}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          @{user.Username}
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <User className="h-4.5 w-4.5" />
                        <span>Profile</span>
                      </Link>
                      {role === "doctor" ? (
                        <Link
                          to="/doctor/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                          <Activity className="h-4.5 w-4.5 text-primary" />
                          <span>Doctor Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          to="/history"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                          <History className="h-4.5 w-4.5 text-primary" />
                          <span>Activity history</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left font-medium mt-1"
                      >
                        <LogOut className="h-4.5 w-4.5" />
                        <span>Log out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <Lock className="h-4.5 w-4.5" />
                        <span>Đăng nhập</span>
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <User className="h-4.5 w-4.5" />
                        <span>Tạo tài khoản</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
