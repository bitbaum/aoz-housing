/**
 * Email colour tokens — the one legitimate second palette in the product.
 *
 * Every other surface reads its colours from the CSS custom properties in
 * `globals.css`. Email cannot: mail clients strip <style> blocks and have no
 * support for CSS custom properties, so colour has to be inlined as literal
 * hex on each element. That constraint is real, but "we must inline hex" does
 * not mean "hex may be scattered across 24 template strings" — it means the
 * literals belong in exactly one file, which is this one.
 *
 * These values intentionally mirror the semantic tokens in globals.css. They
 * are a deliberate copy, not a drifted one; the design-system test exempts
 * this file by name so the exemption is visible rather than implicit.
 */
export const EMAIL_COLORS = {
  /** Headings. Mirrors --color-ui-text. */
  text: '#1f2937',
  /** Body copy. */
  textBody: '#374151',
  /** Footers and de-emphasised metadata. Mirrors --color-ui-muted. */
  textMuted: '#9ca3af',
  /** Subdued label text. */
  muted: '#6b7280',

  /** Hairline rules and table cell borders. Mirrors --color-ui-border. */
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  /** Panel fill inside a message. Mirrors --color-ui-subtle. */
  surfaceSubtle: '#f9fafb',
  /** Table header fill. */
  surfaceHeader: '#f3f4f6',
  onAccent: '#ffffff',

  /** Mirrors --color-status-error. */
  danger: '#dc2626',
  dangerStrong: '#991b1b',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',

  /** Mirrors --color-status-warning. */
  warning: '#f59e0b',

  /** Mirrors --color-status-info. */
  info: '#0369a1',
  infoStrong: '#0c4a6e',
  infoBg: '#f0f9ff',
  infoBorder: '#bae6fd',
} as const
