/**
 * Cart totals — pure functions over integer Rappen. Shipping and VAT policy
 * is config here, not scattered through routes.
 *
 * Prices are VAT-INCLUSIVE (Swiss B2C convention). The VAT figure shown at
 * checkout is the share already contained in the total, not an addition.
 */

export interface CartLine {
  unitPriceRappen: number
  quantity: number
}

export const SHIPPING_METHODS = ['STANDARD', 'EXPRESS'] as const
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]

/** Free standard shipping from CHF 100 (the promise on the homepage). */
export const FREE_SHIPPING_THRESHOLD_RAPPEN = 100_00
export const STANDARD_SHIPPING_RAPPEN = 5_00
export const EXPRESS_SHIPPING_RAPPEN = 15_00

/** Swiss standard VAT rate since 2024: 8.1%. */
export const VAT_RATE = 0.081

export function subtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => {
    if (!Number.isInteger(line.unitPriceRappen) || !Number.isInteger(line.quantity)) {
      throw new Error('Cart lines must carry integer Rappen and integer quantities')
    }
    if (line.quantity < 0 || line.unitPriceRappen < 0) {
      throw new Error('Cart lines must not be negative')
    }
    return sum + line.unitPriceRappen * line.quantity
  }, 0)
}

export function shippingFor(subtotalRappen: number, method: ShippingMethod = 'STANDARD'): number {
  if (subtotalRappen <= 0) return 0
  if (method === 'EXPRESS') return EXPRESS_SHIPPING_RAPPEN
  return subtotalRappen >= FREE_SHIPPING_THRESHOLD_RAPPEN ? 0 : STANDARD_SHIPPING_RAPPEN
}

/** VAT share already included in a gross amount: gross − gross / (1 + rate). */
export function includedVat(grossRappen: number, rate: number = VAT_RATE): number {
  if (!Number.isInteger(grossRappen)) throw new Error('VAT expects integer Rappen')
  return Math.round(grossRappen - grossRappen / (1 + rate))
}

export interface CartTotals {
  subtotalRappen: number
  shippingRappen: number
  vatRappen: number
  totalRappen: number
}

export function cartTotals(
  lines: readonly CartLine[],
  method: ShippingMethod = 'STANDARD'
): CartTotals {
  const sub = subtotal(lines)
  const shipping = shippingFor(sub, method)
  const total = sub + shipping
  return {
    subtotalRappen: sub,
    shippingRappen: shipping,
    vatRappen: includedVat(total),
    totalRappen: total,
  }
}
