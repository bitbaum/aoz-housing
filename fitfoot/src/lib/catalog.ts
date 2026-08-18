/**
 * Catalog queries — the storefront's read side.
 */
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, productVariants, type Product, type ProductVariant } from '@/db/schema'
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/config/database'

export interface CatalogFilters {
  type?: string
  category?: string
}

export async function listProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  const conditions = [eq(products.active, true)]
  if (filters.type && (PRODUCT_TYPES as readonly string[]).includes(filters.type)) {
    conditions.push(eq(products.productType, filters.type))
  }
  if (filters.category && (PRODUCT_CATEGORIES as readonly string[]).includes(filters.category)) {
    conditions.push(eq(products.category, filters.category))
  }
  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name))
}

export async function getProductBySlug(
  slug: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1)
  if (!product) return null
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(asc(productVariants.size))
  return { product, variants }
}

/** The three homepage favorites: cheapest refurb + two bestsellers by name. */
export async function featuredProducts(): Promise<Product[]> {
  const all = await listProducts()
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  const picks = ['eco-trail-runner', 'urban-sneaker', 'refurb-hiking-boot']
    .map((slug) => bySlug.get(slug))
    .filter((p): p is Product => Boolean(p))
  return picks.length === 3 ? picks : all.slice(0, 3)
}
