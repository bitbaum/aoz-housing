/**
 * Cart persistence — the cart lives in OUR database, addressed by an
 * httpOnly cookie token. Guests get a cart; signing in adopts it.
 */
import { and, eq, inArray } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { cartItems, carts, products, productVariants } from '@/db/schema'
import { cartTotals, type CartLine } from './totals'

export const CART_COOKIE = 'fitfoot_cart'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface CartView {
  id: string
  items: Array<{
    id: string
    variantId: string
    productId: string
    productName: string
    slug: string
    imageUrl: string
    category: string
    size: string
    color: string
    unitPriceRappen: number
    quantity: number
    stockQty: number
  }>
  subtotalRappen: number
  shippingRappen: number
  vatRappen: number
  totalRappen: number
}

export async function getCartId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

export async function getOrCreateCartId(): Promise<string> {
  const existing = await getCartId()
  if (existing) {
    const [row] = await db.select({ id: carts.id }).from(carts).where(eq(carts.id, existing)).limit(1)
    if (row) return row.id
  }
  const [created] = await db.insert(carts).values({}).returning({ id: carts.id })
  const store = await cookies()
  store.set(CART_COOKIE, created.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  })
  return created.id
}

export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<void> {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1)
  if (!variant) throw new Error('Variant not found')

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .limit(1)

  const newQty = Math.min((existing?.quantity ?? 0) + quantity, variant.stockQty, 10)
  if (newQty <= 0) return

  if (existing) {
    await db.update(cartItems).set({ quantity: newQty }).where(eq(cartItems.id, existing.id))
  } else {
    await db.insert(cartItems).values({ cartId, variantId, quantity: newQty })
  }
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId))
}

export async function updateCartItem(cartId: string, itemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
    return
  }
  await db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
}

export async function loadCart(cartId: string | null): Promise<CartView> {
  const empty: CartView = {
    id: cartId ?? '',
    items: [],
    subtotalRappen: 0,
    shippingRappen: 0,
    vatRappen: 0,
    totalRappen: 0,
  }
  if (!cartId) return empty

  const rows = await db
    .select({
      id: cartItems.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      size: productVariants.size,
      color: productVariants.color,
      stockQty: productVariants.stockQty,
      productId: products.id,
      productName: products.name,
      slug: products.slug,
      imageUrl: products.imageUrl,
      category: products.category,
      unitPriceRappen: products.priceRappen,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartId))

  const lines: CartLine[] = rows.map((r) => ({
    unitPriceRappen: r.unitPriceRappen,
    quantity: r.quantity,
  }))
  const totals = cartTotals(lines)

  return { id: cartId, items: rows, ...totals }
}

export async function clearCart(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))
}

/** Remove any lines whose variant no longer has stock (called before checkout). */
export async function dropOutOfStockLines(cartId: string): Promise<string[]> {
  const view = await loadCart(cartId)
  const dead = view.items.filter((i) => i.stockQty < i.quantity)
  if (dead.length > 0) {
    await db.delete(cartItems).where(
      inArray(
        cartItems.id,
        dead.map((d) => d.id)
      )
    )
  }
  return dead.map((d) => d.productName)
}
