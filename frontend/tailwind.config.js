/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5f5",
          100: "#d3e6e6",
          200: "#a7cccc",
          300: "#79b0b0",
          400: "#4f9494",
          500: "#2f7878",
          600: "#1f5f60",
          700: "#164848",  // cor primaria (teal clinico, sobrio)
          800: "#123939",
          900: "#0d2929",
        },
        accent: {
          500: "#2f8f6f", // status positivo / saude
          600: "#256f57",
        },
        warn: { 500: "#b9791f" },
        danger: { 500: "#b3402f" },
        surface: {
          DEFAULT: "#f6f7f7",
          card: "#ffffff",
          sidebar: "#0f2c2c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
