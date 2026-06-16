/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Brand tokens — see docs/ARCHITECTURE.md for the full design system.
        background: "#0F172A", // page background
        surface: "#16213A", // cards, panels
        "surface-2": "#1E293B", // raised elements, code blocks
        border: "#243049",
        primary: "#38BDF8", // accent / CTA
        "primary-dim": "#1E3A52",
        text: "#E2E8F0",
        muted: "#94A3B8",
        success: "#4ADE80",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56, 189, 248, 0.15), 0 8px 30px rgba(56, 189, 248, 0.08)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};
