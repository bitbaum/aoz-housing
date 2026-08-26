/**
 * Order status — a small explicit state machine, not a free-text field.
 * Every transition staff can make is listed here; the admin UI renders
 * exactly these, so an illegal transition is unrepresentable.
 */
export const ORDER_STATUSES = [
  'PENDING', // placed, awaiting payment confirmation
  'PAID', // payment confirmed
  'SHIPPED', // handed to carrier
  'COMPLETED', // delivered / closed
  'CANCELLED', // cancelled before payment
  'REFUNDED', // paid, then money returned
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value)
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Statuses that still count as "open" work for staff. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED']
