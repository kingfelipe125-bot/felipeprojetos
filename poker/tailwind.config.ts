import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter Variable'", "system-ui", "sans-serif"],
        display: ["'Outfit Variable'", "'Inter Variable'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#07090d",
          900: "#0c1017",
          800: "#131925",
          700: "#1c2433",
          600: "#2a3446",
        },
        felt: {
          900: "#07301f",
          800: "#0a3d28",
          700: "#0e4f34",
          600: "#136443",
        },
        gold: {
          300: "#f5d98b",
          400: "#e9c268",
          500: "#d4a64a",
          600: "#a97f2f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
