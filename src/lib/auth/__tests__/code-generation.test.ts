import { generateStaffCode } from '../code-generation'
import { BRAND } from '@/lib/config/brand'

// Codes carry the active brand's prefix, so these assert against the brand
// rather than a literal — otherwise a re-badge fails the suite for no reason.
const PREFIX = BRAND.codePrefix

describe('generateStaffCode', () => {
  it("starts with the active brand's code prefix", () => {
    expect(generateStaffCode().startsWith(PREFIX)).toBe(true)
  })

  it('returns a prefix plus a 6-character suffix', () => {
    expect(generateStaffCode()).toHaveLength(PREFIX.length + 6)
  })

  it('suffix contains only allowed characters (no ambiguous O/0/I/1)', () => {
    // Run enough iterations to catch any forbidden chars with high probability
    const ALLOWED = new RegExp(`^${PREFIX}[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`)
    for (let i = 0; i < 100; i++) {
      expect(generateStaffCode()).toMatch(ALLOWED)
    }
  })

  it('never contains ambiguous characters O, 0, I, or 1', () => {
    const FORBIDDEN = /[O01I]/
    for (let i = 0; i < 200; i++) {
      const suffix = generateStaffCode().slice(4)
      expect(suffix).not.toMatch(FORBIDDEN)
    }
  })

  it('produces different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateStaffCode()))
    // With 32^6 ≈ 1 billion possibilities, 50 unique out of 50 is certain
    expect(codes.size).toBe(50)
  })
})
