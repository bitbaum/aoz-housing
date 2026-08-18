/**
 * Zod schemas — SSOT for request shapes; types derive from these.
 * Emails lowercased+trimmed at the boundary, once.
 */
import { z } from 'zod'
import {
  CONDITION_GRADES,
  CUSTOMER_ROLES,
  GENDERS,
  INQUIRY_STATUSES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from '@/config/database'
import { ORDER_STATUSES } from '@/lib/orders/status'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254)

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(200),
})

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: emailSchema,
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
})

export const newsletterSchema = z.object({
  email: emailSchema,
})

export const cartAddSchema = z.object({
  variantId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
})

export const cartUpdateSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(0).max(10), // 0 removes
})

export const checkoutSchema = z.object({
  email: emailSchema,
  shipName: z.string().trim().min(1).max(200),
  shipStreet: z.string().trim().min(1).max(200),
  shipZip: z.string().trim().min(4).max(10),
  shipCity: z.string().trim().min(1).max(100),
  shipCountry: z.string().trim().length(2).toUpperCase().default('CH'),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']).default('STANDARD'),
})

// --- Admin / CRM ---

export const productUpsertSchema = z.object({
  // Optional — the server auto-generates a slug from the name when omitted
  // or blank, so staff never has to invent a URL-safe string by hand.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(PRODUCT_CATEGORIES),
  productType: z.enum(PRODUCT_TYPES).default('NEW'),
  conditionGrade: z.enum(CONDITION_GRADES).nullable().default(null),
  brand: z.string().trim().max(100).default('FitFoot'),
  gender: z.enum(GENDERS).default('UNISEX'),
  shortDescription: z.string().trim().max(300).default(''),
  description: z.string().trim().max(10_000).default(''),
  materials: z.string().trim().max(500).default(''),
  careInstructions: z.string().trim().max(2000).default(''),
  origin: z.string().trim().max(100).default('Switzerland'),
  sustainabilityNotes: z.string().trim().max(2000).default(''),
  sustainabilityFeatures: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  priceChf: z.string().trim().min(1), // parsed via chfToRappen at the boundary
  compareAtChf: z.string().trim().nullable().default(null),
  imageUrl: z.string().trim().max(1000).default(''),
  imageDataUrl: z.string().trim().max(3_000_000).nullable().default(null),
  active: z.coerce.boolean().default(true),
})

// Variants nested inside a product create — no SKU: the server generates it.
export const nestedVariantSchema = z.object({
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().max(50).default(''),
  stockQty: z.coerce.number().int().min(0).max(100_000).default(0),
})

export const productCreateSchema = productUpsertSchema.extend({
  variants: z.array(nestedVariantSchema).max(50).default([]),
})

export const variantUpsertSchema = z.object({
  // Optional — auto-generated from the product + size + color when omitted.
  sku: z.string().trim().max(100).toUpperCase().optional(),
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().max(50).default(''),
  stockQty: z.coerce.number().int().min(0).max(100_000),
})

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})

export const inquiryStatusSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
})

export const crmNoteSchema = z.object({
  body: z.string().trim().min(1).max(5000),
})

export const customerRoleSchema = z.object({
  role: z.enum(CUSTOMER_ROLES),
})
