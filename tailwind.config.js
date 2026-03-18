/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C0392B",
          light: "#E74C3C",
          dark: "#A02D23",
        },
        accent: {
          DEFAULT: "#1A7A6E",
          dark: "#0F4F47",
          light: "#3C9697",
        },
        neutral: {
          50: "#fbf8f5",
          100: "#f4efe8",
          200: "#eee8e1",
          300: "#dfd7cf",
          400: "#d9d1ca",
          500: "#67777d",
          600: "#34525a",
          700: "#17353a",
          800: "#0a1a1d",
          900: "#050810",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.08)",
          dark: "rgba(9, 22, 26, 0.34)",
          darkStrong: "rgba(11, 27, 32, 0.42)",
          border: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Avenir Next", "Segoe UI", "sans-serif"],
        display: ["Plus Jakarta Sans", "Avenir Next", "Segoe UI", "sans-serif"],
        body: ["Plus Jakarta Sans", "Avenir Next", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        xs: ["0.72rem", { lineHeight: "1.2" }],
        sm: ["0.86rem", { lineHeight: "1.4" }],
        base: ["1rem", { lineHeight: "1.65" }],
        lg: ["1.02rem", { lineHeight: "1.8" }],
        xl: ["1.4rem", { lineHeight: "1.6" }],
        "2xl": ["1.8rem", { lineHeight: "1.4" }],
        "3xl": ["2.4rem", { lineHeight: "1.3" }],
        "4xl": ["3.2rem", { lineHeight: "1.2" }],
        "5xl": ["4rem", { lineHeight: "1.1" }],
        "6xl": ["5.6rem", { lineHeight: "1" }],
      },
      borderRadius: {
        xs: "0.75rem",
        sm: "1rem",
        md: "1.4rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "1.85rem",
      },
      boxShadow: {
        glass: "0 24px 48px rgba(7, 17, 20, 0.14)",
        soft: "0 18px 38px rgba(12, 34, 38, 0.08)",
        DEFAULT: "0 24px 46px rgba(12, 34, 38, 0.11)",
        strong: "0 28px 54px rgba(12, 34, 38, 0.12)",
        panel: "0 14px 32px rgba(12, 34, 38, 0.08)",
      },
      backdropBlur: {
        glass: "12px",
        heavy: "18px",
      },
      spacing: {
        container: "clamp(1rem, 3.6vw, 3rem)",
      },
      maxWidth: {
        container: "1328px",
        "container-wide": "1392px",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        slideIn: "slideIn 0.3s ease-out",
        fadeIn: "fadeIn 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

