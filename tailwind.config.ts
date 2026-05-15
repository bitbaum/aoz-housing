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
        // AOZ brand colors — references globals.css CSS vars; supports opacity modifiers
        'aoz': {
          'primary':        'rgb(var(--color-aoz-primary) / <alpha-value>)',
          'primary-light':  'rgb(var(--color-aoz-primary-light) / <alpha-value>)',
          'primary-dark':   'rgb(var(--color-aoz-primary-dark) / <alpha-value>)',
          'secondary':      'rgb(var(--color-aoz-secondary) / <alpha-value>)',
          'secondary-light':'rgb(var(--color-aoz-secondary-light) / <alpha-value>)',
          'secondary-dark': 'rgb(var(--color-aoz-secondary-dark) / <alpha-value>)',
          'accent':         'rgb(var(--color-aoz-accent) / <alpha-value>)',
          'accent-light':   'rgb(var(--color-aoz-accent-light) / <alpha-value>)',
          'accent-dark':    'rgb(var(--color-aoz-accent-dark) / <alpha-value>)',
          'background':     'rgb(var(--color-aoz-background) / <alpha-value>)',
          'surface':        'rgb(var(--color-aoz-surface) / <alpha-value>)',
        },
        // Compatibility score colors (5-tier system)
        'score': {
          'excellent': 'rgb(var(--color-score-excellent) / <alpha-value>)',
          'good':      'rgb(var(--color-score-good) / <alpha-value>)',
          'medium':    'rgb(var(--color-score-medium) / <alpha-value>)',
          'low':       'rgb(var(--color-score-low) / <alpha-value>)',
          'critical':  'rgb(var(--color-score-critical) / <alpha-value>)',
        },
        // Incident severity colors
        'severity': {
          'low':      'rgb(var(--color-severity-low) / <alpha-value>)',
          'medium':   'rgb(var(--color-severity-medium) / <alpha-value>)',
          'high':     'rgb(var(--color-severity-high) / <alpha-value>)',
          'critical': 'rgb(var(--color-severity-critical) / <alpha-value>)',
        },
        // Status colors
        'status': {
          'success': 'rgb(var(--color-status-success) / <alpha-value>)',
          'warning': 'rgb(var(--color-status-warning) / <alpha-value>)',
          'error':   'rgb(var(--color-status-error) / <alpha-value>)',
          'info':    'rgb(var(--color-status-info) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':      'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
      },
    },
  },
  plugins: [],
}

export default config
