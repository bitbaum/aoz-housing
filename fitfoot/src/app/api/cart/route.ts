import { NextResponse } from 'next/server'
import { getCartId, loadCart } from '@/lib/cart/server'
import { handleRouteError } from '@/lib/api'

export async function GET() {
  try {
    const cart = await loadCart(await getCartId())
    return NextResponse.json(cart)
  } catch (error) {
    return handleRouteError(error, 'cart')
  }
}
