import { generateStaffCode } from '../code-generation'

describe('generateStaffCode', () => {
  it('returns a string starting with "AOZ-"', () => {
    expect(generateStaffCode()).toMatch(/^AOZ-/)
  })

  it('returns a code of total length 10 (prefix 4 + suffix 6)', () => {
    expect(generateStaffCode()).toHaveLength(10)
  })

  it('suffix contains only allowed characters (no ambiguous O/0/I/1)', () => {
    // Run enough iterations to catch any forbidden chars with high probability
    const ALLOWED = /^AOZ-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
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
