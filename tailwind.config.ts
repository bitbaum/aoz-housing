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
          'excellent':      'rgb(var(--color-score-excellent) / <alpha-value>)',
          'excellent-text': 'rgb(var(--color-score-excellent-text) / <alpha-value>)',
          'good':           'rgb(var(--color-score-good) / <alpha-value>)',
          'good-text':      'rgb(var(--color-score-good-text) / <alpha-value>)',
          'medium':         'rgb(var(--color-score-medium) / <alpha-value>)',
          'medium-text':    'rgb(var(--color-score-medium-text) / <alpha-value>)',
          'low':            'rgb(var(--color-score-low) / <alpha-value>)',
          'low-text':       'rgb(var(--color-score-low-text) / <alpha-value>)',
          'critical':       'rgb(var(--color-score-critical) / <alpha-value>)',
          'critical-text':  'rgb(var(--color-score-critical-text) / <alpha-value>)',
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
          'success':      'rgb(var(--color-status-success) / <alpha-value>)',
          'success-text': 'rgb(var(--color-status-success-text) / <alpha-value>)',
          'warning':      'rgb(var(--color-status-warning) / <alpha-value>)',
          'warning-text': 'rgb(var(--color-status-warning-text) / <alpha-value>)',
          'error':        'rgb(var(--color-status-error) / <alpha-value>)',
          'error-text':   'rgb(var(--color-status-error-text) / <alpha-value>)',
          'info':         'rgb(var(--color-status-info) / <alpha-value>)',
          'info-text':    'rgb(var(--color-status-info-text) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.5rem',
        '2xl': '0.5rem',
        '3xl': '0.5rem',
      },
      letterSpacing: {
        tighter: '0',
        tight: '0',
        normal: '0',
        wide: '0',
        wider: '0',
        widest: '0',
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
