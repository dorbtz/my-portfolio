/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: "var(--font-sans)" },
      colors: {
        ink: "rgb(var(--color-ink))",
        accent: "rgb(var(--color-accent))",
        accent2: "rgb(var(--color-accent-2))",
      },
      spacing: {
        "space-0": "var(--space-0)",
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-5": "var(--space-5)",
        "space-6": "var(--space-6)",
        "space-8": "var(--space-8)",
        "space-10": "var(--space-10)",
        "space-12": "var(--space-12)",
        "space-16": "var(--space-16)",
        "space-20": "var(--space-20)",
      },
      boxShadow: {
        surface: "var(--shadow-surface)",
        "surface-hover": "var(--shadow-surface-hover)",
      },
      borderRadius: { xl2: "var(--radius-xl)" },
    },
  },
  plugins: [],
}
