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
          950: '#020617', // Deepest background
          900: '#0f172a', // Main background
          800: '#1e293b', // Card backgrounds
          700: '#334155', // Borders/Secondary backgrounds
          400: '#94a3b8', // Muted text
          200: '#e2e8f0', // Primary text
        },
        accent: {
          start: '#6366f1', // Indigo-500
          end: '#a855f7',   // Purple-500
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
