import {
  allowedTransitions,
  canTransition,
  isOrderStatus,
  ORDER_STATUSES,
} from '@/lib/orders/status'

describe('order status machine', () => {
  it('recognises all statuses', () => {
    for (const s of ORDER_STATUSES) {
      expect(isOrderStatus(s)).toBe(true)
    }
    expect(isOrderStatus('BANANA')).toBe(false)
  })

  it('follows the happy path', () => {
    expect(canTransition('PENDING', 'PAID')).toBe(true)
    expect(canTransition('PAID', 'SHIPPED')).toBe(true)
    expect(canTransition('SHIPPED', 'COMPLETED')).toBe(true)
  })

  it('allows cancellation only before payment', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true)
    expect(canTransition('PAID', 'CANCELLED')).toBe(false)
    expect(canTransition('SHIPPED', 'CANCELLED')).toBe(false)
  })

  it('allows refunds only after payment', () => {
    expect(canTransition('PAID', 'REFUNDED')).toBe(true)
    expect(canTransition('SHIPPED', 'REFUNDED')).toBe(true)
    expect(canTransition('PENDING', 'REFUNDED')).toBe(false)
  })

  it('terminal states go nowhere', () => {
    expect(allowedTransitions('COMPLETED')).toHaveLength(0)
    expect(allowedTransitions('CANCELLED')).toHaveLength(0)
    expect(allowedTransitions('REFUNDED')).toHaveLength(0)
  })

  it('never allows skipping payment', () => {
    expect(canTransition('PENDING', 'SHIPPED')).toBe(false)
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false)
  })
})
