/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        // SoftBid Luxury Gold
        gold: {
          50:  "#fdf8ec", 100: "#f9f0d0", 200: "#f3e2a1", 300: "#ead076",
          400: "#e0bc4e", 500: "#d4a843", 600: "#b8862a", 700: "#976618",
          800: "#7d510f", 900: "#674410",
        },
        luxury: {
          950: "#09090f", 900: "#111118", 800: "#1a1a26",
          700: "#22223a", 600: "#2a2a48",
        },
        ivory: { DEFAULT: "#f5f0e8", muted: "#c9bfae", subtle: "#9d8f7a" },
        // shadcn/ui CSS variable tokens
        border:       "hsl(var(--border))",
        input:        "hsl(var(--input))",
        ring:         "hsl(var(--ring))",
        background:   "hsl(var(--background))",
        foreground:   "hsl(var(--foreground))",
        primary:      { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:    { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive:  { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:        { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:       { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover:      { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card:         { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        // Semantic
        success: "#059669", warning: "#d97706", danger: "#e11d48",
      },
      borderRadius: {
        lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      backgroundImage: {
        "gold-gradient":  "linear-gradient(135deg, #b8862a 0%, #d4a843 50%, #e0bc4e 100%)",
        "gold-shimmer":   "linear-gradient(90deg, #d4a843, #f0c96a, #d4a843)",
        "card-gradient":  "linear-gradient(135deg, rgba(212,168,67,0.06) 0%, transparent 100%)",
        "hero-glow":      "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,168,67,0.15), transparent)",
      },
      boxShadow: {
        "gold-sm": "0 0 10px rgba(212,168,67,0.15)",
        "gold":    "0 0 24px rgba(212,168,67,0.25)",
        "gold-lg": "0 0 48px rgba(212,168,67,0.35)",
        "card":    "0 4px 24px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "accordion-down":  { from: { height: 0 }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":    { from: { height: "var(--radix-accordion-content-height)" }, to: { height: 0 } },
        "gold-pulse":      { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
        "shimmer":         { from: { backgroundPosition: "-200% center" }, to: { backgroundPosition: "200% center" } },
        "fade-up":         { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "gold-pulse":     "gold-pulse 2s ease-in-out infinite",
        "shimmer":        "shimmer 3s linear infinite",
        "fade-up":        "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
