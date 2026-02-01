/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#7f13ec",
        secondary: "#3b82f6",
        "background-light": "#f7f6f8",
        "background-dark": "#050505",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "primary/20": "0 10px 15px -3px rgba(127, 19, 236, 0.2), 0 4px 6px -4px rgba(127, 19, 236, 0.2)",
      },
    },
  },
  plugins: [],
};
