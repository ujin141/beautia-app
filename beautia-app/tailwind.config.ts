import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F7F7FB",
        primary: "#111114",
        secondary: "#6B6B76",
        line: "#EAEAEE",
        brand: {
          pink: "#F9B4C9",
          mint: "#B6E6D8",
          lilac: "#B9B7F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "var(--font-noto-sans-kr)", "sans-serif"],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        '5xl': '32px',
      },
      backgroundImage: {
        'blur-gradient': 'linear-gradient(135deg, #F9B4C9 0%, #B6E6D8 50%, #B9B7F5 100%)',
        'subtle-glow': 'radial-gradient(circle at center, rgba(249,180,201,0.15) 0%, rgba(255,255,255,0) 70%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blob': 'blob 7s infinite',
        'scroll-left': 'scrollLeft 40s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.33%)' }, // Assuming 3 sets of items
        }
      }
    },
  },
  plugins: [],
};
export default config;
