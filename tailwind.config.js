import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // สำคัญมาก: ต้องครอบคลุมโฟลเดอร์ app
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // สำคัญมาก: ครอบคลุมโฟลเดอร์ components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;