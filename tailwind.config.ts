import type { Config } from 'tailwindcss'

/**
 * Tailwind maps utilities onto the CSS custom properties defined in
 * `src/app/globals.css`. It holds ZERO literal design values by design: a
 * re-theme or a re-badge must be an edit to globals.css alone, never a sweep
 * through this file and 294 components.
 *
 * The one deliberate exception is the font-size scale, which is structural
 * rather than expressive — every brand renders text at the same sizes — so it
 * stays on Tailwind's defaults plus a `2xs` step for micro-labels.
 */
const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors — the active palette is chosen by the data-brand
        // attribute on <html>. @see lib/config/brand.ts
        'brand': {
          'primary':        'rgb(var(--color-brand-primary) / <alpha-value>)',
          'primary-light':  'rgb(var(--color-brand-primary-light) / <alpha-value>)',
          'primary-dark':   'rgb(var(--color-brand-primary-dark) / <alpha-value>)',
          'secondary':      'rgb(var(--color-brand-secondary) / <alpha-value>)',
          'secondary-light':'rgb(var(--color-brand-secondary-light) / <alpha-value>)',
          'secondary-dark': 'rgb(var(--color-brand-secondary-dark) / <alpha-value>)',
          'accent':         'rgb(var(--color-brand-accent) / <alpha-value>)',
          'accent-light':   'rgb(var(--color-brand-accent-light) / <alpha-value>)',
          'accent-dark':    'rgb(var(--color-brand-accent-dark) / <alpha-value>)',
          'background':     'rgb(var(--color-brand-background) / <alpha-value>)',
          'surface':        'rgb(var(--color-brand-surface) / <alpha-value>)',
        },
        'ui': {
          'canvas':        'rgb(var(--color-ui-canvas) / <alpha-value>)',
          'surface':       'rgb(var(--color-ui-surface) / <alpha-value>)',
          'elevated':      'rgb(var(--color-ui-elevated) / <alpha-value>)',
          'subtle':        'rgb(var(--color-ui-subtle) / <alpha-value>)',
          'border':        'rgb(var(--color-ui-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--color-ui-border-strong) / <alpha-value>)',
          'text':          'rgb(var(--color-ui-text) / <alpha-value>)',
          'muted':         'rgb(var(--color-ui-muted) / <alpha-value>)',
          'inverse':       'rgb(var(--color-ui-inverse) / <alpha-value>)',
          'on-accent':     'rgb(var(--color-ui-on-accent) / <alpha-value>)',
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
          'contrast':       'rgb(var(--color-score-contrast) / <alpha-value>)',
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
        // Numeric and code-like data. @see the `.numeric` component class.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Micro-label step below Tailwind's `xs`, for `.eyebrow` and `.badge`.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        '3xl':'var(--radius-2xl)',
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        heading: 'var(--tracking-heading)',
        tighter: 'var(--tracking-display)',
        tight:   'var(--tracking-tight)',
        normal:  'var(--tracking-normal)',
        wide:    'var(--tracking-wide)',
        wider:   'var(--tracking-label)',
        widest:  'var(--tracking-eyebrow)',
        label:   'var(--tracking-label)',
        eyebrow: 'var(--tracking-eyebrow)',
      },
      boxShadow: {
        // The ONLY shadow in the system. Reserved for content that genuinely
        // floats above other content — menus, popovers, dialogs, drawers.
        // In-page surfaces are flat and separate with a hairline border.
        'overlay': 'var(--shadow-overlay)',
      },
    },
  },
  plugins: [],
}

export default config
