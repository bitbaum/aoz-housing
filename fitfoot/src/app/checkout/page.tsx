import Link from 'next/link'
import type { Metadata } from 'next'
import { getCartId, loadCart } from '@/lib/cart/server'
import { readSession } from '@/lib/auth/session'
import { CheckoutForm } from '@/components/shop/CheckoutForm'
import { formatRappen } from '@/lib/money'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout',
}

export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([getCartId().then(loadCart), readSession()])

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-heading text-3xl">Nothing to check out</h1>
        <p className="mt-2 text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Back to the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl sm:text-4xl">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm initialEmail={session?.email ?? ''} subtotalRappen={cart.subtotalRappen} />
        </div>

        <div className="card h-fit">
          <h2 className="font-heading text-xl">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="text-ink">
                  {item.quantity} × {item.productName} ({item.size})
                </span>
                <span className="font-medium">
                  {formatRappen(item.unitPriceRappen * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
            Subtotal: <strong>{formatRappen(cart.subtotalRappen)}</strong>
            <br />
            Shipping is calculated from your chosen method.
          </p>
        </div>
      </div>
    </div>
  )
}
