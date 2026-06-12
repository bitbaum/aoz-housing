'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS, NAV_ICONS, type NavItem } from '@/lib/config/navigation'
import { APP_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management + Escape + body lock. We don't use the shared
  // useDismissable hook here because we also want the close button to
  // claim focus on open, and to return focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
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
    openButtonRef.current?.focus()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* Mobile header bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-ui-surface/95 backdrop-blur-sm border-b border-ui-border z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo size="md" />
          <button
            ref={openButtonRef}
            onClick={() => setIsOpen(true)}
            className="btn-icon"
            aria-label={UI_LABELS.menuOpen}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-40 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        id="mobile-nav-drawer"
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[280px] bg-ui-surface z-50 transform transition-transform duration-200 ease-in-out md:hidden border-r border-ui-border ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={UI_LABELS.navigation}
      >
        <div className="p-5 border-b border-ui-border">
          <div className="flex items-start justify-between">
            <div>
              <Logo size="lg" />
              <p className="text-sm text-ui-muted mt-1">{APP_LABELS.tagline}</p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="btn-icon -mr-2"
              aria-label={UI_LABELS.menuClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="px-3 py-3">
          <div className="mb-2 flex justify-end">
            <ThemeToggle />
          </div>
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm min-h-[44px] ${
        active
          ? 'text-ui-text bg-ui-subtle font-medium'
          : 'text-ui-muted hover:text-ui-text hover:bg-ui-subtle'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-aoz-primary' : ''}`} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  )
}
