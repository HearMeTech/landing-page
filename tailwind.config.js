/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'],
      },
      colors: {
        'brand-teal': {
          light: '#94d2bd',
          DEFAULT: '#0a9396',
          dark: '#005f73'
        },
        'brand-navy': '#001219',
      }
    }
  },
  plugins: [],
}
