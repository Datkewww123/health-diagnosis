import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

// Import Pages
import Home from "./pages/Home";
import Predict from "./pages/Predict";
import Search from "./pages/Search";
import DiseaseDetail from "./pages/DiseaseDetail";
import HistoryPage from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import HospitalRecommend from "./pages/HospitalRecommend";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Booking from "./pages/Booking";
import SymptomDetail from "./pages/SymptomDetail";
import { useAuth } from "./hooks/useAuth";

// Protect Routes requiring login
const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Protect Routes requiring admin role
const AdminRoute = () => {
  const { isLoggedIn } = useAuth();
  // Đọc role từ localStorage (sync) thay vì React state (async) để tránh race condition sau navigate()
  const role = (localStorage.getItem("role") || "user").trim().toLowerCase();
  if (!isLoggedIn && !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Non-Layout Route Pages (Auth screens) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Protected Routes (No Layout Wrapper) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Layout Wrapper Pages */}
            <Route element={<Layout><Outlet /></Layout>}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/hospital" element={<HospitalRecommend />} />

              {/* Login Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/search" element={<Search />} />
                <Route path="/search-history" element={<Navigate to="/history?tab=search" replace />} />
                <Route path="/predict-history" element={<Navigate to="/history?tab=predict" replace />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/symptom/:id" element={<SymptomDetail />} />
                <Route path="/disease/:id" element={<DiseaseDetail />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
