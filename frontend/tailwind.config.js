/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        buy: "#00d4a1",
        hold: "#f5a623",
        sell: "#ff4757",
      },
    },
  },
  plugins: [],
};
