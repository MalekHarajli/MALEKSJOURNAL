/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0e1024',
        raise: '#181b38',
        card: '#1b1f40',
        edge: '#2c3160',
        'edge-lit': '#474e8f',
        mist: '#a6aed1',
        bone: '#f1f2ff',
        glow: {
          DEFAULT: '#8b96ff',
          soft: '#b3bbff',
        },
        win: '#31f2a9',
        loss: '#ff6f7d',
        even: '#9aa7c7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'view-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'view-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'view-in': 'view-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'view-out': 'view-out 200ms ease-in both',
        'rise': 'rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
