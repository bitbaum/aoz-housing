import { chfToRappen, formatRappen } from '@/lib/money'

describe('chfToRappen', () => {
  it('parses plain francs', () => {
    expect(chfToRappen('89')).toBe(8900)
  })

  it('parses dot decimals', () => {
    expect(chfToRappen('89.90')).toBe(8990)
  })

  it('parses comma decimals (Swiss keyboards)', () => {
    expect(chfToRappen('89,90')).toBe(8990)
  })

  it('parses single decimal digit', () => {
    expect(chfToRappen('89.9')).toBe(8990)
  })

  it("parses thousands separators (1'299.00)", () => {
    expect(chfToRappen("1'299.00")).toBe(129900)
  })

  it('parses numbers', () => {
    expect(chfToRappen(89.9)).toBe(8990)
  })

  it('rejects garbage', () => {
    expect(() => chfToRappen('abc')).toThrow()
    expect(() => chfToRappen('89.999')).toThrow()
    expect(() => chfToRappen('')).toThrow()
  })
})

describe('formatRappen', () => {
  it('formats with two decimals', () => {
    expect(formatRappen(8990)).toBe('CHF 89.90')
  })

  it('groups thousands Swiss-style', () => {
    expect(formatRappen(129900)).toBe("CHF 1'299.00")
  })

  it('formats zero', () => {
    expect(formatRappen(0)).toBe('CHF 0.00')
  })

  it('formats negatives', () => {
    expect(formatRappen(-500)).toBe('-CHF 5.00')
  })

  it('rejects non-integers', () => {
    expect(() => formatRappen(89.9)).toThrow()
  })
})
