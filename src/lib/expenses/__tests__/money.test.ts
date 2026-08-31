import { chfToRappen, formatRappen } from '../money'

describe('chfToRappen', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['12,50', 1250],
    ['0.05', 5],
    ["1'234.50", 123450],
    ['1’234.50', 123450], // Swiss typographic apostrophe
    [' 7 ', 700],
    ['0', 0],
  ])('parses %s → %i', (input, expected) => {
    expect(chfToRappen(input)).toBe(expected)
  })

  it.each([['abc'], ['12.345'], ['-5'], ['12.'], [''], ['1.2.3'], ['CHF 12']])(
    'rejects %s',
    (input) => {
      expect(chfToRappen(input)).toBeNull()
    },
  )
})

describe('formatRappen', () => {
  it.each([
    [1250, 'CHF 12.50'],
    [5, 'CHF 0.05'],
    [123450, "CHF 1'234.50"],
    [100000000, "CHF 1'000'000.00"],
    [-1250, '-CHF 12.50'],
    [0, 'CHF 0.00'],
  ])('formats %i → %s', (rappen, expected) => {
    expect(formatRappen(rappen)).toBe(expected)
  })

  it('round-trips through chfToRappen for positive amounts', () => {
    for (const rappen of [1, 99, 100, 1250, 123450, 999999]) {
      const formatted = formatRappen(rappen).replace('CHF ', '')
      expect(chfToRappen(formatted)).toBe(rappen)
    }
  })
})
