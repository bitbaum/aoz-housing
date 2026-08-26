/**
 * UI label SSOT — every human-readable label for a config-driven enum
 * value lives here, once. Previously these were separate `Record<string,
 * string>` literals hand-copied into shop/page.tsx, shop/[slug]/page.tsx,
 * OrderStatusBadge.tsx, and admin/inquiries/page.tsx.
 */
import type { OrderStatus } from '@/lib/orders/status'

export const CATEGORY_LABELS: Record<string, string> = {
  SNEAKERS: 'Sneakers',
  RUNNING: 'Running',
  BOOTS: 'Boots',
  FORMAL: 'Formal',
  SANDALS: 'Sandals',
  ACCESSORIES: 'Accessories',
}

export const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like new',
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
}

export const GENDER_LABELS: Record<string, string> = {
  MEN: "Men's",
  WOMEN: "Women's",
  UNISEX: 'Unisex',
  KIDS: "Kids'",
}

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

/** Verb-phrase button labels for staff-initiated order transitions. */
export const ORDER_ACTION_LABELS: Record<string, string> = {
  PAID: 'Mark as paid',
  SHIPPED: 'Mark as shipped',
  COMPLETED: 'Mark as completed',
  CANCELLED: 'Cancel order',
  REFUNDED: 'Mark as refunded',
}

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING: 'badge-warning',
  PAID: 'badge-gold',
  SHIPPED: 'badge-gold',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-neutral',
  REFUNDED: 'badge-error',
}
