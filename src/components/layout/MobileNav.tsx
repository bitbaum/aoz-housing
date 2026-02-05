'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, NAV_ICONS } from '@/lib/config/navigation'
import { APP_LABELS } from '@/lib/constants/labels'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="flex items-center gap-1">
            <span className="text-aoz-primary font-bold text-xl tracking-tight">AOZ</span>
            <span className="text-aoz-secondary font-semibold">Wohnen</span>
          </h1>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-gray-600 hover:text-aoz-secondary"
            aria-label="Menu öffnen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-1">
                <span className="text-aoz-primary font-bold text-2xl tracking-tight">AOZ</span>
                <span className="text-aoz-secondary font-semibold text-lg">Wohnen</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">{APP_LABELS.tagline}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
              aria-label="Menu schliessen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <nav className="px-4 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'text-aoz-secondary bg-aoz-accent font-medium'
                  : 'text-gray-700 hover:text-aoz-secondary hover:bg-aoz-accent'
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-aoz-accent flex items-center justify-center text-aoz-secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={NAV_ICONS[item.icon]} />
                </svg>
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
