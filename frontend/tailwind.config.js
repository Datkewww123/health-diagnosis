/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B6B8C",
          light: "#1387b0",
          dark: "#074c64",
          hover: "#095874",
        },
        accent: {
          DEFAULT: "#2CB1C9",
          light: "#5ad3eb",
          dark: "#1c7e90",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#34d399",
          dark: "#059669",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#f87171",
          dark: "#dc2626",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#fbbf24",
          dark: "#d97706",
        },
      },
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
        heading: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(11, 107, 140, 0.04)",
        md: "0 6px 18px rgba(11, 107, 140, 0.08)",
        lg: "0 12px 32px rgba(11, 107, 140, 0.12)",
      },
    },
  },
  plugins: [],
};
