import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              Đã xảy ra lỗi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang.
            </p>
            <pre className="text-xs text-left bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-32 text-slate-600 dark:text-slate-300">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all text-sm"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
