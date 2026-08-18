import { NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/validation/schemas'
import { checkout, CheckoutError } from '@/lib/orders/checkout'
import { getCartId } from '@/lib/cart/server'
import { getSession } from '@/lib/auth/guards'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`checkout:${getClientIp(request)}`, 10, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many attempts. Please try again later.')
    }
    const input = checkoutSchema.parse(await request.json())
    const cartId = await getCartId()
    if (!cartId) return jsonError(400, 'Your cart is empty.')

    const session = await getSession()
    const result = await checkout({
      cartId,
      email: input.email,
      customerId: session?.sub ?? null,
      shipName: input.shipName,
      shipStreet: input.shipStreet,
      shipZip: input.shipZip,
      shipCity: input.shipCity,
      shipCountry: input.shipCountry,
      shippingMethod: input.shippingMethod,
    })
    await sendEmail(input.email, 'orderConfirmation', result.orderNumber, result.totalRappen)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CheckoutError) return jsonError(409, error.message)
    return handleRouteError(error, 'checkout')
  }
}
