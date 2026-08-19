import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order confirmed',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl" aria-hidden>
        🎉
      </p>
      <h1 className="mt-6 font-heading text-4xl">Thank you!</h1>
      <p className="mt-3 text-muted">
        Your order{' '}
        {order ? <strong className="text-ink">{order}</strong> : null}{' '}
        has been placed. We&apos;ve sent a confirmation to your email and will let you know as soon
        as it ships.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className="btn-gold">
          Continue shopping
        </Link>
        <Link href="/account" className="btn-outline-gold">
          View your orders
        </Link>
      </div>
    </div>
  )
}
