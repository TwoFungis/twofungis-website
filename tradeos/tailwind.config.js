/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'charcoal': {
          900: '#0d0d0d',
          800: '#1a1a1a',
          700: '#262626',
          600: '#333333',
        },
        'steel': {
          400: '#7da7c7',
          500: '#5a8fb8',
          600: '#4a7a9e',
        },
        'success': '#4a7c59',
        'warning': '#c9a227',
        'risk': '#b84444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
