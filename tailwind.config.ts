import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serifDisplay: ["var(--font-serif-display)", "Georgia", "serif"],
        sansSharp: ["var(--font-sans-sharp)", "Inter", "system-ui", "sans-serif"],
        sansUi: ["var(--font-sans-ui)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(18, 40, 74, 0.08)",
        soft: "0 10px 26px rgba(18, 40, 74, 0.06)",
      },
      colors: {
        uii: {
          navy: "#071B42",
          deep: "#0B214A",
          blue: "#173F8A",
          orange: "#F37021",
          orange2: "#FF7A2F",
          bg: "#F6F8FC",
          surface: "#FFFFFF",
          border: "#E8ECF2",
          text: "#12284A",
          muted: "#65748B",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          sketch: "#E64B35",
          cream: "#FFF6EF",
        },
      },
      backgroundImage: {
        gridpaper:
          "linear-gradient(rgba(18,40,74,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(18,40,74,0.035) 1px, transparent 1px)",
        notebook:
          "linear-gradient(rgba(23,63,138,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(23,63,138,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
