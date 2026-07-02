import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#e6e6de",
        ink: "#20211f",
        muted: "#7b776e",
        gold: "#d0a02e"
      },
      boxShadow: {
        soft: "0 20px 70px rgba(32, 33, 31, 0.14)"
      }
    }
  },
  plugins: []
} satisfies Config;
