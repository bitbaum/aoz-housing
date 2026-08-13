import { splitEqually } from '../split'

describe('splitEqually', () => {
  it('splits an even amount exactly', () => {
    const shares = splitEqually(3000, ['a', 'b', 'c'])
    expect(shares).toEqual([
      { residentId: 'a', amountRappen: 1000 },
      { residentId: 'b', amountRappen: 1000 },
      { residentId: 'c', amountRappen: 1000 },
    ])
  })

  it('distributes the remainder deterministically to the first ids in sorted order', () => {
    const shares = splitEqually(1000, ['c', 'a', 'b'])
    // 1000 / 3 = 333 rem 1 → 'a' gets the extra Rappen regardless of input order
    expect(shares).toEqual([
      { residentId: 'a', amountRappen: 334 },
      { residentId: 'b', amountRappen: 333 },
      { residentId: 'c', amountRappen: 333 },
    ])
  })

  it('always sums exactly to the total (the money-must-balance invariant)', () => {
    for (let total = 1; total <= 500; total++) {
      for (const n of [1, 2, 3, 4, 7]) {
        const ids = Array.from({ length: n }, (_, i) => `r${i}`)
        const sum = splitEqually(total, ids).reduce((acc, s) => acc + s.amountRappen, 0)
        expect(sum).toBe(total)
      }
    }
  })

  it('deduplicates participant ids', () => {
    const shares = splitEqually(1000, ['a', 'a', 'b'])
    expect(shares).toHaveLength(2)
    expect(shares.reduce((acc, s) => acc + s.amountRappen, 0)).toBe(1000)
  })

  it('rejects non-positive totals, non-integers and empty participants', () => {
    expect(() => splitEqually(0, ['a'])).toThrow()
    expect(() => splitEqually(-100, ['a'])).toThrow()
    expect(() => splitEqually(10.5, ['a'])).toThrow()
    expect(() => splitEqually(100, [])).toThrow()
  })
})
