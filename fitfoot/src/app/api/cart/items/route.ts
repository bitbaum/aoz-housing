import { NextResponse } from 'next/server'
import { cartAddSchema, cartUpdateSchema } from '@/lib/validation/schemas'
import { addToCart, getOrCreateCartId, getCartId, loadCart, updateCartItem } from '@/lib/cart/server'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const input = cartAddSchema.parse(await request.json())
    const cartId = await getOrCreateCartId()
    await addToCart(cartId, input.variantId, input.quantity)
    return NextResponse.json(await loadCart(cartId))
  } catch (error) {
    return handleRouteError(error, 'cart/items POST')
  }
}

export async function PATCH(request: Request) {
  try {
    const input = cartUpdateSchema.parse(await request.json())
    const cartId = await getCartId()
    if (!cartId) return jsonError(404, 'No cart found.')
    await updateCartItem(cartId, input.itemId, input.quantity)
    return NextResponse.json(await loadCart(cartId))
  } catch (error) {
    return handleRouteError(error, 'cart/items PATCH')
  }
}
