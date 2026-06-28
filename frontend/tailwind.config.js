/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // We will define custom primary and secondary variables that map to CSS variables set dynamically from settings
        primary: {
          DEFAULT: 'var(--primary-color, #7b4dff)',
          dark: 'var(--primary-color-dark, #6234e3)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color, #00d4ff)',
        }
      }
    },
  },
  plugins: [],
}
