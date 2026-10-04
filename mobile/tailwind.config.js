/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#FFC400", dark: "#E0A800", soft: "#FFF4CC" },
        ink: { DEFAULT: "#0B0B0F", soft: "#1C1C22" },
        surface: "#F4F5F7",
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
      },
    },
  },
  plugins: [],
};
