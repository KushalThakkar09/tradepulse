/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0e14',
          800: '#121721',
          700: '#1a2130',
          600: '#252e42',
          500: '#334155'
        },
        trade: {
          green: '#10b981',
          greenHover: '#059669',
          red: '#ef4444',
          redHover: '#dc2626',
          blue: '#3b82f6',
          gold: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
