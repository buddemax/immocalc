import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7f6f3",
          100: "#ece6da",
          200: "#ddcfb4",
          300: "#cbaf84",
          400: "#ba945e",
          500: "#a67a45",
          600: "#8a6038",
          700: "#6f4b2f",
          800: "#5b3e2a",
          900: "#4d3527"
        }
      }
    }
  },
  plugins: [],
};

export default config;
