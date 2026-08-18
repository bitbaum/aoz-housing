import type { Config } from 'tailwindcss'

/**
 * Design tokens carried over from the original FitFoot "Refined Swiss Luxury"
 * palette: deep gold on pure white with a warm gray ramp.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFFDF7',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#B8860B',
          600: '#92400E',
          700: '#78350F',
          800: '#451A03',
          900: '#292524',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-playfair)', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}

export default config
