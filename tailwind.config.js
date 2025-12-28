/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF5900',
          magenta: '#EF0C7F',
          coal: '#404040',
          red: '#ED1C24', // Keeping legacy red for internal refs if any
        },
        enterprise: {
          50: '#F8F9FA',  // Base Neutral (From image)
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CCCCCC', // Light Gray (From image)
          400: '#94A3B8',
          500: '#64748B',
          600: '#4B5563',
          700: '#404040', // Dark Gray/Coal (From image)
          800: '#2D2D2D',
          900: '#1A1A1A',
          950: '#111111',
        },
        // Semantic states optimized for contrast
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand': '0 10px 30px -10px rgba(255, 89, 0, 0.2)',
      },
      backgroundImage: {
        'univision-gradient': 'linear-gradient(135deg, #FF5900 0%, #EF0C7F 100%)',
        'univision-gradient-soft': 'linear-gradient(135deg, #F8F9FA 0%, #CCCCCC 100%)',
      }
    },
  },
  plugins: [],
}
