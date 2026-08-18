/**
 * TABLE_NAMES — single source of truth for every database table name,
 * following the evig pattern: every query and every schema definition
 * references these constants, never a hardcoded string. If a table name
 * is wrong, it is wrong in exactly one place.
 */
export const TABLE_NAMES = {
  // Catalog
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  PRODUCT_IMAGES: 'product_images',

  // Customers & CRM
  CUSTOMERS: 'customers',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  ADDRESSES: 'addresses',
  CRM_NOTES: 'crm_notes',
  CONTACT_INQUIRIES: 'contact_inquiries',
  NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers',

  // Commerce
  CARTS: 'carts',
  CART_ITEMS: 'cart_items',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
} as const

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES]

/** Role tiers, evig-style: Users → Staff → Admins. */
export const CUSTOMER_ROLES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const
export type CustomerRole = (typeof CUSTOMER_ROLES)[number]

/** Product categories — config, not a DB enum: a new category is a config change, never a migration. */
export const PRODUCT_CATEGORIES = [
  'SNEAKERS',
  'RUNNING',
  'BOOTS',
  'FORMAL',
  'SANDALS',
  'ACCESSORIES',
] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

/** The two paths, one mission: brand new eco-friendly, or expertly refurbished. */
export const PRODUCT_TYPES = ['NEW', 'REFURBISHED'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const GENDERS = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] as const
export type Gender = (typeof GENDERS)[number]

/** Condition grades for refurbished pairs. */
export const CONDITION_GRADES = ['LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR'] as const
export type ConditionGrade = (typeof CONDITION_GRADES)[number]

/** Contact inquiry statuses for the CRM inbox. */
export const INQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]
