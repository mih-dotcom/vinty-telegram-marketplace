/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          brand: 'var(--color-primary-green)',
          brandDark: 'var(--color-primary-green-dark)',
          brandLight: 'var(--color-primary-green-light)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
        sheet: 'var(--radius-sheet)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.18)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.9) translateY(8px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 1s linear infinite',
        'pop-in': 'pop-in 260ms cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slide-up 320ms cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
