import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { LOCALES, LOCALE_IDS } from '@/lib/i18n/locales'

/**
 * The portal must lay out correctly in Arabic and Persian.
 *
 * `dir="rtl"` flips the writing direction, but it does NOT flip Tailwind's
 * physical utilities: `ml-2` is margin-LEFT in every language. So a portal
 * built from `ml-`, `pl-` and `text-left` renders right-to-left text inside a
 * left-to-right layout — icons on the wrong side of their labels, numbers
 * pushed away from the column they belong to, indentation running backwards.
 * It is not ugly-but-usable; it is the specific failure that makes people
 * assume the app was not meant for them.
 *
 * The logical equivalents (`ms-`, `ps-`, `text-start`) follow `dir`, so the
 * same markup works in both directions with no per-language branching.
 *
 * This is a gate rather than a one-time sweep because the physical utilities
 * are the ones everybody types by habit, they look completely correct in
 * German, and nothing else in the toolchain objects.
 */

const PORTAL_DIRS = [
  join(process.cwd(), 'src', 'components', 'portal'),
  join(process.cwd(), 'src', 'app', 'portal'),
]

/** `ml-2`, `pr-4`, `text-left` — anything that hardcodes a side. */
const PHYSICAL = /\b(?:ml|mr|pl|pr)-[0-9.]+\b|\btext-(?:left|right)\b/

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name.endsWith('.tsx') ? [full] : []
  })
}

const portalFiles = PORTAL_DIRS.flatMap((dir) => (statSync(dir).isDirectory() ? walk(dir) : []))

describe('the portal is direction-agnostic', () => {
  it('finds the portal source files', () => {
    // Without this the sweep below could pass by reading nothing at all.
    expect(portalFiles.length).toBeGreaterThan(10)
  })

  it.each(portalFiles.map((file) => [file.replace(`${process.cwd()}/`, ''), file]))(
    '%s uses logical spacing, not left/right',
    (_label, file) => {
      const offenders = readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(({ line }) => !line.startsWith('*') && !line.startsWith('//'))
        .filter(({ line }) => PHYSICAL.test(line))
        .map(({ line, number }) => `${number}: ${line}`)

      expect(offenders).toEqual([])
    },
  )

  it('would catch a physical utility', () => {
    // A rule that has never fired is a rule nobody has checked.
    expect(PHYSICAL.test('className="ml-2 text-sm"')).toBe(true)
    expect(PHYSICAL.test('className="text-right"')).toBe(true)
  })

  it('does not flag the logical replacements', () => {
    expect(PHYSICAL.test('className="ms-2 text-start"')).toBe(false)
    expect(PHYSICAL.test('className="pe-4 text-end"')).toBe(false)
  })

  it('leaves symmetric spacing alone', () => {
    // `px-` and `mx-` are already direction-agnostic; flagging them would make
    // the rule noise and get it switched off.
    expect(PHYSICAL.test('className="px-4 mx-auto"')).toBe(false)
  })
})

describe('right-to-left languages are declared as such', () => {
  it('marks Arabic and Persian rtl, and nothing else by accident', () => {
    const rtl = LOCALE_IDS.filter((id) => LOCALES[id].dir === 'rtl')
    expect(rtl.sort()).toEqual(['ar', 'fa'])
  })
})
