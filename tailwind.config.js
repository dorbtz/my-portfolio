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
      borderRadius: { xl2: "var(--radius-xl)" },
    },
  },
  plugins: [],
}
