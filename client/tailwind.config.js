/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0D0D0D',
          secondary: '#D4AF37',
          light: '#F5EADF',
          dark: '#1A1F36',
          muted: '#6B6B6B',
          burgundy: '#5A0F1A',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
