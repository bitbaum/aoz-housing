/**
 * Drizzle schema — the whole platform's data lives here, in OUR database.
 * No Medusa, no Sanity, no Supabase: catalog, customers, orders and the CRM
 * are first-class tables we own (the evig architecture).
 *
 * Table names come from TABLE_NAMES (src/config/database.ts) — never inline.
 * Money is integer Rappen everywhere (see src/lib/money.ts).
 */
import {
  boolean,
  customType,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

/** Raw bytes — image data lives in its own table so it never loads on list queries. */
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea'
  },
})
import { createId } from '@/lib/id'
import { TABLE_NAMES } from '@/config/database'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => createId())

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const products = pgTable(
  TABLE_NAMES.PRODUCTS,
  {
    id: id(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(), // ProductCategory (config, not DB enum)
    productType: text('product_type').notNull().default('NEW'), // ProductType: NEW | REFURBISHED
    conditionGrade: text('condition_grade'), // ConditionGrade, refurbished only
    brand: text('brand').notNull().default('FitFoot'),
    gender: text('gender').notNull().default('UNISEX'), // Gender
    shortDescription: text('short_description').notNull().default(''),
    description: text('description').notNull().default(''),
    materials: text('materials').notNull().default(''),
    careInstructions: text('care_instructions').notNull().default(''),
    origin: text('origin').notNull().default('Switzerland'), // where it is made
    sustainabilityNotes: text('sustainability_notes').notNull().default(''), // e.g. "Saves 12kg CO₂ vs new production"
    sustainabilityFeatures: text('sustainability_features').array().notNull().default([]),
    priceRappen: integer('price_rappen').notNull(),
    compareAtRappen: integer('compare_at_rappen'), // strike-through price, refurb savings story
    imageUrl: text('image_url').notNull().default(''),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('products_slug_idx').on(t.slug), index('products_category_idx').on(t.category)]
)

export const productVariants = pgTable(
  TABLE_NAMES.PRODUCT_VARIANTS,
  {
    id: id(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    size: text('size').notNull(), // EU size as text ("42", "One Size")
    color: text('color').notNull().default(''),
    stockQty: integer('stock_qty').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('product_variants_sku_idx').on(t.sku),
    index('product_variants_product_idx').on(t.productId),
  ]
)

/**
 * One image per product, kept out of the `products` row so its bytes never
 * ride along on catalog list queries. `products.imageUrl` points at the
 * serving route (`/api/products/[id]/image`) once an upload exists.
 */
export const productImages = pgTable(TABLE_NAMES.PRODUCT_IMAGES, {
  productId: text('product_id')
    .primaryKey()
    .references(() => products.id, { onDelete: 'cascade' }),
  data: bytea('data').notNull(),
  mimeType: text('mime_type').notNull(),
  updatedAt: updatedAt(),
})

// ---------------------------------------------------------------------------
// Customers & CRM
// ---------------------------------------------------------------------------

export const customers = pgTable(
  TABLE_NAMES.CUSTOMERS,
  {
    id: id(),
    email: text('email').notNull(),
    passwordHash: text('password_hash'), // null = guest checkout record, no login yet
    firstName: text('first_name').notNull().default(''),
    lastName: text('last_name').notNull().default(''),
    phone: text('phone').notNull().default(''),
    role: text('role').notNull().default('CUSTOMER'), // CustomerRole: CUSTOMER | STAFF | ADMIN
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(false),
    active: boolean('active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('customers_email_idx').on(t.email)]
)

/** Single-use, SHA-256-at-rest password reset tokens (never store the raw token). */
export const passwordResetTokens = pgTable(
  TABLE_NAMES.PASSWORD_RESET_TOKENS,
  {
    id: id(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('password_reset_tokens_hash_idx').on(t.tokenHash),
    index('password_reset_tokens_customer_idx').on(t.customerId),
  ]
)

export const addresses = pgTable(
  TABLE_NAMES.ADDRESSES,
  {
    id: id(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    street: text('street').notNull(),
    zip: text('zip').notNull(),
    city: text('city').notNull(),
    country: text('country').notNull().default('CH'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('addresses_customer_idx').on(t.customerId)]
)

/** Free-form staff notes on a customer — the beating heart of a CRM. */
export const crmNotes = pgTable(
  TABLE_NAMES.CRM_NOTES,
  {
    id: id(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('crm_notes_customer_idx').on(t.customerId)]
)

export const contactInquiries = pgTable(
  TABLE_NAMES.CONTACT_INQUIRIES,
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('NEW'), // InquiryStatus
    customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('contact_inquiries_status_idx').on(t.status)]
)

export const newsletterSubscribers = pgTable(
  TABLE_NAMES.NEWSLETTER_SUBSCRIBERS,
  {
    id: id(),
    email: text('email').notNull(),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('newsletter_subscribers_email_idx').on(t.email)]
)

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------

export const carts = pgTable(TABLE_NAMES.CARTS, {
  id: id(), // doubles as the cart token in the cookie
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const cartItems = pgTable(
  TABLE_NAMES.CART_ITEMS,
  {
    id: id(),
    cartId: text('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [
    index('cart_items_cart_idx').on(t.cartId),
    uniqueIndex('cart_items_cart_variant_idx').on(t.cartId, t.variantId),
  ]
)

export const orders = pgTable(
  TABLE_NAMES.ORDERS,
  {
    id: id(),
    orderNumber: text('order_number').notNull(), // FF-2026-0001
    // Restrict, not cascade: an order is a business record; customers exit via `active`.
    customerId: text('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
    email: text('email').notNull(), // always present, guest or not
    status: text('status').notNull().default('PENDING'), // OrderStatus (src/lib/orders/status.ts)
    subtotalRappen: integer('subtotal_rappen').notNull(),
    shippingMethod: text('shipping_method').notNull().default('STANDARD'), // ShippingMethod
    shippingRappen: integer('shipping_rappen').notNull(),
    vatRappen: integer('vat_rappen').notNull().default(0), // VAT share INCLUDED in total (Swiss B2C)
    totalRappen: integer('total_rappen').notNull(),
    // Shipping address SNAPSHOT — orders must stay correct after the customer moves.
    shipName: text('ship_name').notNull(),
    shipStreet: text('ship_street').notNull(),
    shipZip: text('ship_zip').notNull(),
    shipCity: text('ship_city').notNull(),
    shipCountry: text('ship_country').notNull().default('CH'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('orders_number_idx').on(t.orderNumber),
    index('orders_customer_idx').on(t.customerId),
    index('orders_status_idx').on(t.status),
  ]
)

export const orderItems = pgTable(
  TABLE_NAMES.ORDER_ITEMS,
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    // Snapshots — the order line stays truthful even if the product is edited or deleted.
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(),
    size: text('size').notNull(),
    color: text('color').notNull().default(''),
    unitPriceRappen: integer('unit_price_rappen').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)]
)

// ---------------------------------------------------------------------------
// Inferred types — the evig pattern: types derive from the schema, nowhere else.
// ---------------------------------------------------------------------------

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductVariant = typeof productVariants.$inferSelect
export type ProductImage = typeof productImages.$inferSelect
export type Customer = typeof customers.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type Address = typeof addresses.$inferSelect
export type CrmNote = typeof crmNotes.$inferSelect
export type ContactInquiry = typeof contactInquiries.$inferSelect
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect
export type Cart = typeof carts.$inferSelect
export type CartItem = typeof cartItems.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
