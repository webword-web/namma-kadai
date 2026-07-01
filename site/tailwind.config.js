// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0B3D91", // Royal Blue
        accent: "#FF5A1F", // Orange
        gold: "#FFC107",
        neutral: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)"
      },
      backdropBlur: {
        glass: "lg"
      }
    }
  },
  plugins: [],
  darkMode: "class"
};
