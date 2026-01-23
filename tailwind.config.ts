import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AOZ brand colors (from aoz.ch)
        'aoz': {
          'primary': '#E63946',    // Red/coral - AOZ logo color, CTAs
          'primary-light': '#EF5A67',
          'primary-dark': '#C62D3A',
          'secondary': '#2D5A5A',  // Dark teal - navigation, secondary actions
          'secondary-light': '#3D7A7A',
          'secondary-dark': '#1D4A4A',
          'accent': '#D4EDDA',     // Mint green - backgrounds, highlights
          'accent-light': '#E8F5E9',
          'accent-dark': '#B8DFC2',
          'background': '#f8fafc', // Light background
          'surface': '#ffffff',
        },
        // Compatibility score colors (5-tier system)
        'score': {
          'excellent': '#22C55E', // 80-100: Sehr gut
          'good': '#84CC16',      // 60-79: Gut
          'medium': '#F59E0B',    // 40-59: Mittel
          'low': '#F97316',       // 20-39: Niedrig
          'critical': '#EF4444', // 0-19: Kritisch
        },
        // Incident severity colors
        'severity': {
          'low': '#9CA3AF',       // Gray
          'medium': '#FBBF24',    // Amber
          'high': '#F97316',      // Orange
          'critical': '#EF4444',  // Red
        },
        // Status colors
        'status': {
          'success': '#22C55E',
          'warning': '#F59E0B',
          'error': '#EF4444',
          'info': '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
