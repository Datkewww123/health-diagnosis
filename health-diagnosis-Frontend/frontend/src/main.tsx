import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Global error handlers to surface runtime errors (helps debug blank page in production)
window.addEventListener("error", (ev) => {
  console.error("Uncaught error:", ev.error || ev.message || ev);
  try {
    const el = document.getElementById("root");
    if (el) {
      el.textContent = `An error occurred: ${(ev.error && ev.error.message) || ev.message || ev}`;
    }
  } catch (e) {
    // ignore
  }
});

window.addEventListener("unhandledrejection", (ev) => {
  console.error("Unhandled rejection:", ev.reason);
  try {
    const el = document.getElementById("root");
    if (el) {
      el.textContent = `Unhandled promise rejection: ${String(ev.reason)}`;
    }
  } catch (e) {
    // ignore
  }
});

function mountApp() {
  const container = document.getElementById("root");
  if (!container) {
    document.body.innerHTML = '<div style="padding:20px;color:#900;background:#fee;border:1px solid #f99">App mount failed: #root element not found</div>';
    return;
  }
  try {
    const root = createRoot(container);
    // Lấy Google Client ID từ biến môi trường của Vite
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    
    root.render(
      <React.StrictMode>
        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            <App />
          </GoogleOAuthProvider>
        ) : (
          <App />
        )}
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error("Error mounting React app:", err);
    container.textContent = `Render error: ${err && err.message}`;
  }
}

mountApp();
