import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B2E",
        card: "#1C2F4A",
        slate: "#194766",
        border: "#2A3F5C",
        orange: "#FF4A2D",
        blue: "#4FA3D1",
        green: "#2ECC8A",
        amber: "#F5A623",
        muted: "#6B7F96",
        white: "#F0F4F8",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
