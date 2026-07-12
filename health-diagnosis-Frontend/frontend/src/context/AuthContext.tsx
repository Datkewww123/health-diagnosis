import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { setToken } from "../api/client";

interface User {
  id?: string;
  Username?: string;
  email?: string;
  phone?: string;
  First_name?: string;
  Last_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  height?: number;
  weight?: number;
  date_of_birth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | string;
  hospital_id?: number | null;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  role: string;
  login: (token: string, user: User, role: string) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem("token");
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [role, setRole] = useState<string>(() => {
    const storedRole = localStorage.getItem("role");
    return (storedRole || "user").trim().toLowerCase();
  });

  const loadAuthState = () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      setRole((storedRole || "user").trim().toLowerCase());
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
    } else {
      setToken(null);
      setIsLoggedIn(false);
      setUser(null);
      setRole("user");
    }
  };

  useEffect(() => {
    // Đảm bảo client API token được set ngay khi mount
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }

    const handleAuthChange = () => {
      loadAuthState();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const login = (newToken: string, newUser: User, newRole: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("role", newRole);
    setToken(newToken);
    setIsLoggedIn(true);
    setUser(newUser);
    setRole(newRole.trim().toLowerCase());
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { role: newRole } }));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
    setRole("user");
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { role: "user" } }));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        role,
        login,
        logout,
        refreshAuth: loadAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
