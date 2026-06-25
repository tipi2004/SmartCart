import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        skyPastel: "#BFE8FF",
        cloud: "#F8FCFF",
        cream: "#FFF4DC",
        blush: "#FFDDE8",
        mint: "#DDF7EC",
        navySoft: "#1D3153",
        navyMuted: "#5B6986",
        honey: "#F7C873"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(91, 105, 134, 0.16)",
        button: "0 10px 24px rgba(29, 49, 83, 0.16)"
      },
      borderRadius: {
        cute: "1.75rem"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
