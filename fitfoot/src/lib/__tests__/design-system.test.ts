/**
 * Design-system guard — every color used anywhere in the UI must come
 * from the token block in globals.css, not a hardcoded hex or an
 * arbitrary Tailwind palette color (text-gray-500, bg-[#fff], etc).
 */
import fs from 'fs'
import path from 'path'

function listFiles(dir: string, extensions: string[]): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(full, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(full)
    }
  }
  return out
}

const SRC = path.join(__dirname, '..', '..')
const TSX_FILES = listFiles(SRC, ['.tsx'])
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/
// Tailwind's built-in palette prefixes that bypass the semantic token system.
const RAW_PALETTE_PATTERN =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/

describe('design system', () => {
  it('has no raw hex colors in component/page files', () => {
    const offenders = TSX_FILES.filter((file) => HEX_PATTERN.test(fs.readFileSync(file, 'utf8')))
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([])
  })

  it('has no raw Tailwind palette color classes (use semantic tokens instead)', () => {
    const offenders = TSX_FILES.filter((file) =>
      RAW_PALETTE_PATTERN.test(fs.readFileSync(file, 'utf8'))
    )
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([])
  })

  it('globals.css defines every semantic color token referenced by name here', () => {
    const css = fs.readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8')
    const REQUIRED_TOKENS = [
      '--color-canvas',
      '--color-surface',
      '--color-subtle',
      '--color-line',
      '--color-line-strong',
      '--color-ink',
      '--color-muted',
      '--color-success',
      '--color-warning',
      '--color-error',
      '--color-gold-500',
    ]
    for (const token of REQUIRED_TOKENS) {
      expect(css.includes(token)).toBe(true)
    }
  })

  it('the gold brand ramp has not drifted from the original FitFoot palette', () => {
    const css = fs.readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8')
    expect(css).toContain('--color-gold-500: #b8860b;')
  })
})
