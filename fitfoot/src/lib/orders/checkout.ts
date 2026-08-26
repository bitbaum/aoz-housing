/**
 * Checkout — turns a cart into an order in ONE transaction:
 * re-read stock with row locks, decrement, snapshot prices and address,
 * write order + items, empty the cart. Money never leaves the integer domain.
 */
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cartItems, carts, customers, orderItems, orders, products, productVariants } from '@/db/schema'
import { cartTotals, type ShippingMethod } from '@/lib/cart/totals'
import { generateOrderNumber } from './number'
import { logger } from '@/lib/logger'

export class CheckoutError extends Error {
  constructor(
    public readonly code: 'EMPTY_CART' | 'OUT_OF_STOCK',
    message: string
  ) {
    super(message)
  }
}

export interface CheckoutInput {
  cartId: string
  email: string
  customerId: string | null
  shipName: string
  shipStreet: string
  shipZip: string
  shipCity: string
  shipCountry: string
  shippingMethod: ShippingMethod
}

export interface CheckoutResult {
  orderId: string
  orderNumber: string
  totalRappen: number
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  return db.transaction(async (tx) => {
    const lines = await tx
      .select({
        itemId: cartItems.id,
        quantity: cartItems.quantity,
        variantId: productVariants.id,
        size: productVariants.size,
        color: productVariants.color,
        stockQty: productVariants.stockQty,
        productId: products.id,
        productName: products.name,
        unitPriceRappen: products.priceRappen,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, input.cartId))
      .for('update')

    if (lines.length === 0) {
      throw new CheckoutError('EMPTY_CART', 'Your cart is empty.')
    }
    const short = lines.find((l) => l.stockQty < l.quantity)
    if (short) {
      throw new CheckoutError(
        'OUT_OF_STOCK',
        `"${short.productName}" (size ${short.size}) is no longer available in this quantity.`
      )
    }

    const totals = cartTotals(
      lines.map((l) => ({ unitPriceRappen: l.unitPriceRappen, quantity: l.quantity })),
      input.shippingMethod
    )

    // Guest checkout: make sure a customer record exists for the email so the
    // CRM sees every buyer, account or not.
    let customerId = input.customerId
    if (!customerId) {
      const [existing] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, input.email))
        .limit(1)
      if (existing) {
        customerId = existing.id
      } else {
        const [created] = await tx
          .insert(customers)
          .values({ email: input.email, firstName: '', lastName: input.shipName })
          .returning({ id: customers.id })
        customerId = created.id
      }
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        customerId,
        email: input.email,
        status: 'PENDING',
        subtotalRappen: totals.subtotalRappen,
        shippingMethod: input.shippingMethod,
        shippingRappen: totals.shippingRappen,
        vatRappen: totals.vatRappen,
        totalRappen: totals.totalRappen,
        shipName: input.shipName,
        shipStreet: input.shipStreet,
        shipZip: input.shipZip,
        shipCity: input.shipCity,
        shipCountry: input.shipCountry,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber })

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        size: l.size,
        color: l.color,
        unitPriceRappen: l.unitPriceRappen,
        quantity: l.quantity,
      }))
    )

    for (const l of lines) {
      await tx
        .update(productVariants)
        .set({ stockQty: sql`${productVariants.stockQty} - ${l.quantity}` })
        .where(eq(productVariants.id, l.variantId))
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId))
    await tx.update(carts).set({ customerId }).where(eq(carts.id, input.cartId))

    logger.info('Order placed', { orderNumber: order.orderNumber, totalRappen: totals.totalRappen })
    return { orderId: order.id, orderNumber: order.orderNumber, totalRappen: totals.totalRappen }
  })
}
