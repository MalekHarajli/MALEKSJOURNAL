/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#1e2456',
        raise: '#283069',
        card: '#2b3373',
        edge: '#424b9e',
        'edge-lit': '#616cc7',
        mist: '#b9c0e8',
        bone: '#f5f6ff',
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
