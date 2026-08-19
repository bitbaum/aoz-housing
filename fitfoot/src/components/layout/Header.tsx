import Link from 'next/link'
import { SITE } from '@/config/site'
import { getCartId, loadCart } from '@/lib/cart/server'
import { readSession } from '@/lib/auth/session'
import { MobileNav } from './MobileNav'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/sustainability', label: 'Sustainability' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export async function Header() {
  const [cart, session] = await Promise.all([
    getCartId().then(loadCart).catch(() => null),
    readSession(),
  ])
  const itemCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
  const isStaff = session?.role === 'STAFF' || session?.role === 'ADMIN'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-heading text-2xl tracking-tight">
          {SITE.name}
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="btn-ghost text-sm">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isStaff && (
            <Link href="/admin" className="btn-ghost hidden text-sm sm:inline-flex">
              Admin
            </Link>
          )}
          <Link
            href={session ? '/account' : '/login'}
            className="btn-ghost hidden text-sm sm:inline-flex"
          >
            {session ? 'Account' : 'Sign in'}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 hover:bg-subtle"
            aria-label={`Cart, ${itemCount} items`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <MobileNav
            links={[...NAV_LINKS]}
            isSignedIn={Boolean(session)}
            isStaff={isStaff}
          />
        </div>
      </div>
    </header>
  )
}
