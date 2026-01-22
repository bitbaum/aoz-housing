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
          'primary': '#2c485e',    // Dark navy - AOZ main brand color
          'secondary': '#b5e3ae',  // Sage green - AOZ accent
          'accent': '#4a7c59',     // Darker green for contrast
          'neutral': '#64748b',    // Slate - professional
          'background': '#f8fafc', // Light background
          'surface': '#ffffff',
        },
        // Compatibility score colors
        'score': {
          'excellent': '#10b981', // 80-100
          'good': '#34d399',      // 60-79
          'moderate': '#fbbf24',  // 40-59
          'low': '#f97316',       // 20-39
          'poor': '#ef4444',      // 0-19
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
