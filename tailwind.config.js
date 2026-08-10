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
      boxShadow: {
        glass: '0 1px 2px rgba(16, 24, 20, 0.04), 0 4px 12px rgba(16, 24, 20, 0.05)',
        'glass-lg': '0 2px 8px rgba(16, 24, 20, 0.08), 0 12px 24px rgba(16, 24, 20, 0.08)',
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
