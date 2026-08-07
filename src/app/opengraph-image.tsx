import { ImageResponse } from 'next/og'
import { APP_LABELS } from '@/lib/constants/labels'

/**
 * Social preview card (1200x630 — the 1.91:1 size Slack, Telegram and the
 * OpenGraph scrapers crop to). The app shipped no og:image, so every shared
 * link rendered as a blank grey rectangle.
 *
 * Copy comes from APP_LABELS so the card follows a rebrand automatically —
 * the whole point of the BRAND SSOT. Only the palette is repeated here as
 * literals, because Satori cannot read CSS custom properties.
 */

export const runtime = 'edge'
export const alt = APP_LABELS.metaTitle
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Mirrors --color-ui-text / --color-ui-muted / --color-brand-primary /
// --color-ui-canvas in globals.css. A deliberate copy, not a drifted one:
// Satori cannot read CSS custom properties, so like email (lib/email/tokens.ts)
// this file is an allowlisted literal-hex site in design-system.test.ts.
const INK = '#0A0A0A'
const MUTED = '#707070'
const ACCENT = '#E63946'
const CANVAS = '#FFFFFF'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: CANVAS,
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 3, background: ACCENT, display: 'flex' }} />
          <div style={{ fontSize: 30, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            {APP_LABELS.name}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.06,
              color: INK,
              maxWidth: 980,
            }}
          >
            Intelligentes Platzierungssystem
          </div>
          <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 900 }}>
            {APP_LABELS.metaDescription}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 5, background: ACCENT, display: 'flex' }} />
          <div style={{ fontSize: 24, color: MUTED }}>aoz-wohnen.orangecat.ch</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
