import { generateOrderNumber, ORDER_NUMBER_PATTERN } from '@/lib/orders/number'

describe('generateOrderNumber', () => {
  it('matches the FF-YYYY-NNNNNN pattern', () => {
    const n = generateOrderNumber(new Date('2026-08-14T12:00:00Z'))
    expect(n).toMatch(ORDER_NUMBER_PATTERN)
    expect(n.startsWith('FF-2026-')).toBe(true)
  })

  it('pads short random parts to six digits', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOrderNumber().length).toBe('FF-2026-000000'.length)
    }
  })
})
