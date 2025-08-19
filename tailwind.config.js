/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#5C30A6",
          purpleLt: "#B19CD9",
          gold: "#D6AF36",
          ink: "#121212",
        },
        neutral: {
          50: "#F0F0F0",
          100: "#E0E0E0",
          200: "#D0D0D0",
          300: "#C0C0C0",
          400: "#B0B0B0",
          500: "#A0A0A0",
          600: "#909090",
          700: "#808080",
          800: "#707070",
          900: "#606060",
          950: "#404040",
        },
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 15s linear infinite",
      },
    },
  },
  plugins: [],
};

