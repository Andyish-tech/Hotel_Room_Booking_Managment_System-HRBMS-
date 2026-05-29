/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: '#EFBF04',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1e40af',
          600: '#1e3a8a',
          700: '#1e3380',
          800: '#1a2d6d',
          900: '#172554',
        },
        gold: {
          50: '#fef9e7',
          100: '#fdf0c5',
          200: '#fbe190',
          300: '#f7cd5a',
          400: '#edbc3a',
          500: '#D4AF37',
          600: '#b8962e',
          700: '#8a7022',
          800: '#5c4a16',
          900: '#2e250b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
