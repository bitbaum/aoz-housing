'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MobileNavProps {
  links: Array<{ href: string; label: string }>
  isSignedIn: boolean
  isStaff: boolean
}

export function MobileNav({ links, isSignedIn, isStaff }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 hover:bg-subtle"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-surface shadow-lifted">
          <nav className="flex flex-col p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded px-4 py-3 font-medium text-ink hover:bg-subtle"
              >
                {link.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded px-4 py-3 font-medium text-ink hover:bg-subtle"
              >
                Admin
              </Link>
            )}
            <Link
              href={isSignedIn ? '/account' : '/login'}
              onClick={() => setOpen(false)}
              className="min-h-[44px] rounded px-4 py-3 font-medium text-ink hover:bg-subtle"
            >
              {isSignedIn ? 'Account' : 'Sign in'}
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}
