'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, NAV_ICONS, type NavItem } from '@/lib/config/navigation'
import { APP_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { Logo } from '@/components/ui/Logo'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Move focus to close button when drawer opens
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        // Return focus to trigger button
        openButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    // Return focus to trigger button
    openButtonRef.current?.focus()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo size="md" />
          <button
            ref={openButtonRef}
            onClick={() => setIsOpen(true)}
            className="p-2 text-gray-600 hover:text-aoz-secondary min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-aoz-primary rounded-lg"
            aria-label={UI_LABELS.menuOpen}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        id="mobile-nav-drawer"
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[256px] bg-white z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={UI_LABELS.navigation}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <Logo size="lg" />
              <p className="text-sm text-gray-500 mt-1">{APP_LABELS.tagline}</p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-aoz-primary rounded-lg"
              aria-label={UI_LABELS.menuClose}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <nav className="px-4 py-4">
          {NAV_ITEMS.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onClick={handleClose}
            />
          ))}
        </nav>
      </div>
    </>
  )
}

function MobileNavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = NAV_ICONS[item.icon]
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active
          ? 'text-aoz-secondary bg-aoz-accent font-medium'
          : 'text-gray-700 hover:text-aoz-secondary hover:bg-aoz-accent'
      }`}
    >
      <span className="w-8 h-8 rounded-full bg-aoz-accent flex items-center justify-center text-aoz-secondary">
        <Icon className="w-5 h-5" />
      </span>
      <span>{item.label}</span>
    </Link>
  )
}
