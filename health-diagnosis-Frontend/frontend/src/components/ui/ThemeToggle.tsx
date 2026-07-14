import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "./Button";

export const ThemeToggle: React.FC = () => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  return null;
};

export default ThemeToggle;
