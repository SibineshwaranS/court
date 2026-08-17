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
        court: {
          50: '#f0f4f8',
          100: '#dbe3ed',
          200: '#bdcddc',
          300: '#90acc8',
          400: '#5d83b1',
          500: '#3c6395',
          600: '#2d4d79',
          700: '#253e62',
          800: '#1a2c47',
          900: '#142034',
          950: '#0d1422',
        },
      },
    },
  },
  plugins: [],
}
