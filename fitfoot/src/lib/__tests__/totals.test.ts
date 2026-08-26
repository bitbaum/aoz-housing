import {
  cartTotals,
  EXPRESS_SHIPPING_RAPPEN,
  FREE_SHIPPING_THRESHOLD_RAPPEN,
  includedVat,
  shippingFor,
  STANDARD_SHIPPING_RAPPEN,
  subtotal,
} from '@/lib/cart/totals'

describe('subtotal', () => {
  it('sums lines', () => {
    expect(
      subtotal([
        { unitPriceRappen: 8990, quantity: 2 },
        { unitPriceRappen: 12900, quantity: 1 },
      ])
    ).toBe(8990 * 2 + 12900)
  })

  it('is zero for empty carts', () => {
    expect(subtotal([])).toBe(0)
  })

  it('rejects float prices', () => {
    expect(() => subtotal([{ unitPriceRappen: 89.9, quantity: 1 }])).toThrow()
  })

  it('rejects negative quantities', () => {
    expect(() => subtotal([{ unitPriceRappen: 8990, quantity: -1 }])).toThrow()
  })
})

describe('shippingFor', () => {
  it('standard is free above CHF 100', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_RAPPEN)).toBe(0)
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_RAPPEN + 1)).toBe(0)
  })

  it('standard costs CHF 5 below the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_RAPPEN - 1)).toBe(STANDARD_SHIPPING_RAPPEN)
  })

  it('express always costs CHF 15', () => {
    expect(shippingFor(5000, 'EXPRESS')).toBe(EXPRESS_SHIPPING_RAPPEN)
    expect(shippingFor(50000, 'EXPRESS')).toBe(EXPRESS_SHIPPING_RAPPEN)
  })

  it('is zero for an empty cart', () => {
    expect(shippingFor(0)).toBe(0)
    expect(shippingFor(0, 'EXPRESS')).toBe(0)
  })
})

describe('includedVat', () => {
  it('extracts the 8.1% share contained in a gross price', () => {
    // CHF 108.10 gross = CHF 100 net + CHF 8.10 VAT
    expect(includedVat(10810)).toBe(810)
  })

  it('is zero on zero', () => {
    expect(includedVat(0)).toBe(0)
  })

  it('rejects non-integer input', () => {
    expect(() => includedVat(99.5)).toThrow()
  })
})

describe('cartTotals', () => {
  it('total = subtotal + shipping, VAT included not added', () => {
    const t = cartTotals([{ unitPriceRappen: 4990, quantity: 1 }])
    expect(t.subtotalRappen).toBe(4990)
    expect(t.shippingRappen).toBe(STANDARD_SHIPPING_RAPPEN)
    expect(t.totalRappen).toBe(4990 + STANDARD_SHIPPING_RAPPEN)
    expect(t.vatRappen).toBe(includedVat(t.totalRappen))
    expect(t.vatRappen).toBeLessThan(t.totalRappen)
  })

  it('honours the shipping method', () => {
    const t = cartTotals([{ unitPriceRappen: 17900, quantity: 1 }], 'EXPRESS')
    expect(t.shippingRappen).toBe(EXPRESS_SHIPPING_RAPPEN)
  })
})
