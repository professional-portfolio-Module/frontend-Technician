/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0066FF",
          dark: "#0052CC",
          light: "#E5F0FF",
        },
        secondary: {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#D1FAE5",
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          light: "#FEF3C7",
        },
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#0F172A",
        }
      }
    },
  },
  plugins: [],
};
