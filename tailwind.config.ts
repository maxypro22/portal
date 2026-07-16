import type { Config } from "tailwindcss";

/**
 * Steak Town design system.
 * Brand palette mirrors steaktown.qa — deep warm brown backgrounds,
 * warm gold accents, cream text. Serif display for headings, sans for body.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand surfaces
        brand: {
          // primary background (dark warm brown) — the brand theme color
          DEFAULT: "#2d2424",
          950: "#1c1717",
          900: "#241d1d",
          800: "#2d2424",
          700: "#3a2f2f",
          600: "#4a3c3c",
          500: "#5c4a4a",
        },
        // Warm gold / amber accent (matches steaktown.qa logo tone)
        gold: {
          DEFAULT: "#e0b357",
          light: "#eecb84",
          dark: "#c2913c",
          muted: "#a8823a",
        },
        // Header (near-black) and footer (warm brown) surfaces from steaktown.qa
        ink: {
          DEFAULT: "#0d0a08",
          light: "#171210",
        },
        cocoa: {
          DEFAULT: "#4a3327",
          light: "#5a4030",
          dark: "#3c2a20",
        },
        cream: {
          DEFAULT: "#f5efe6",
          muted: "#d8cfc2",
          dim: "#a99f92",
        },
        // Theme-aware tokens — driven by CSS variables in globals.css so a
        // single [data-theme="light"/"dark"] attribute on <html> repaints
        // every consumer at once. Distinct from `brand`/`cream` above (which
        // stay fixed dark values, still used e.g. for text-brand-950 on gold
        // buttons — that pairing must NOT invert with the theme).
        surface: {
          bg: "rgb(var(--surface-bg) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken) / <alpha-value>)",
          border: "rgb(var(--surface-border) / <alpha-value>)",
          "border-strong": "rgb(var(--surface-border-strong) / <alpha-value>)",
        },
        content: {
          DEFAULT: "rgb(var(--content) / <alpha-value>)",
          muted: "rgb(var(--content-muted) / <alpha-value>)",
          dim: "rgb(var(--content-dim) / <alpha-value>)",
        },
        chrome: {
          header: "rgb(var(--chrome-header) / <alpha-value>)",
          footer: "rgb(var(--chrome-footer) / <alpha-value>)",
        },
        // Status colors for admin badges
        status: {
          pending: "#d9a441",
          confirmed: "#4c9a6a",
          cancelled: "#c0563f",
          completed: "#7c7671",
          noshow: "#8a6bb0",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(224,179,87,0.35), 0 8px 30px -12px rgba(224,179,87,0.4)",
        card: "0 10px 40px -20px rgba(0,0,0,0.6)",
        "card-hover": "0 20px 50px -20px rgba(0,0,0,0.75)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #eecb84 0%, #e0b357 50%, #c2913c 100%)",
        "brand-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(201,162,39,0.10), transparent 60%)",
        "noise-texture":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(224,179,87,0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(224,179,87,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        shimmer: "shimmer 1.6s infinite",
        "pulse-gold": "pulse-gold 2s infinite",
      },
      letterSpacing: {
        luxe: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;
