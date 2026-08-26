import Link from 'next/link'
import type { Metadata } from 'next'
import { getCartId, loadCart } from '@/lib/cart/server'
import { formatRappen } from '@/lib/money'
import { ProductImage } from '@/components/shop/ProductImage'
import { CartLineControls } from '@/components/shop/CartLineControls'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cart',
}

export default async function CartPage() {
  const cart = await loadCart(await getCartId())

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-5xl" aria-hidden>
          🛒
        </p>
        <h1 className="mt-4 font-heading text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-muted">Your perfect pair is waiting in the shop.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Browse the collection
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl sm:text-4xl">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded border border-line p-4">
              <Link href={`/shop/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded">
                <ProductImage imageUrl={item.imageUrl} name={item.productName} category={item.category} />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/shop/${item.slug}`} className="font-semibold hover:text-gold-600">
                      {item.productName}
                    </Link>
                    <p className="text-sm text-muted">
                      Size {item.size}
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold">{formatRappen(item.unitPriceRappen * item.quantity)}</p>
                </div>
                <div className="mt-auto pt-3">
                  <CartLineControls itemId={item.id} quantity={item.quantity} maxQty={Math.min(item.stockQty, 10)} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="card h-fit">
          <h2 className="font-heading text-xl">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatRappen(cart.subtotalRappen)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping (standard)</dt>
              <dd>{cart.shippingRappen === 0 ? 'Free' : formatRappen(cart.shippingRappen)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatRappen(cart.totalRappen)}</dd>
            </div>
            <p className="text-xs text-muted">incl. {formatRappen(cart.vatRappen)} VAT (8.1%)</p>
          </dl>
          <Link href="/checkout" className="btn-gold mt-6 w-full">
            Checkout
          </Link>
          <Link href="/shop" className="btn-ghost mt-2 w-full text-sm">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
