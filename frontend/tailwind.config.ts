import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Space Grotesk'", "sans-serif"]
      },
      colors: {
        ink: "#0b1220",
        ice: "#edf3ff",
        ember: "#ff5d2a",
        gold: "#d8a63f",
        stadium: "#101d33",
        mist: "#d7e2f2",
        track: "#1d3152"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(255,255,255,0.12) 1px, transparent 1px)"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(255,93,42,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
