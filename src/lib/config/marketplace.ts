/**
 * Marketplace configuration — SSOT
 *
 * Photo size/type policy is shared with the resident avatar upload
 * (`@/lib/config/profile`'s `PHOTO_LIMITS`) rather than duplicated here —
 * one server-side byte cap for the whole product.
 */

export const MARKETPLACE_LIMITS = {
  /** A give-away/lend post gets a handful of photos, not a full gallery. */
  maxPhotosPerPost: 4,
  maxReportReasonLength: 500,
} as const
