/**
 * Server-side generation helpers for the admin catalog forms — staff never
 * types a slug or a SKU; these look up what already exists and dedupe.
 */
import { like } from 'drizzle-orm'
import { db } from '@/db'
import { products, productVariants } from '@/db/schema'
import { dedupeSlug, slugify } from '@/lib/slug'
import { dedupeSku, generateSku } from '@/lib/sku'

export async function resolveProductSlug(name: string, requested?: string): Promise<string> {
  const base = slugify(requested?.trim() || name)
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(like(products.slug, `${base}%`))
  return dedupeSlug(base, new Set(existing.map((r) => r.slug)))
}

export async function resolveVariantSku(
  productSlug: string,
  size: string,
  color: string,
  requested?: string
): Promise<string> {
  const base = requested?.trim().toUpperCase() || generateSku(productSlug, size, color)
  const existing = await db
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(like(productVariants.sku, `${base}%`))
  return dedupeSku(base, new Set(existing.map((r) => r.sku)))
}
