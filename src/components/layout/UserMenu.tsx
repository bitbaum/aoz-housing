'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, LogOut, ArrowRightLeft } from 'lucide-react'
import { ROLE_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { useDismissable } from '@/lib/hooks/useDismissable'

interface UserMenuProps {
  user: {
    name: string
    email: string
    role: string
  }
  hasPortalAccess?: boolean
}

export function UserMenu({ user, hasPortalAccess }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useDismissable<HTMLDivElement>(isOpen, () => setIsOpen(false))

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setIsLoggingOut(false)
    }
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-ui-subtle transition-colors min-h-[44px]"
        aria-label={UI_LABELS.userMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Identity tile — not a brand avatar; uses neutral surface so it
            doesn't compete with the brand-coloured nav links. */}
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-ui-text text-ui-inverse text-sm font-medium select-none">
          {initials}
        </span>
        <span className="hidden lg:block text-sm text-ui-muted">{user.name}</span>
        <ChevronDown className="w-4 h-4 text-ui-muted" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border py-1 z-50"
        >
          {/* User identity panel */}
          <div className="px-4 py-3 border-b border-ui-border">
            <p className="text-sm font-medium text-ui-text">{user.name}</p>
            {user.email && (
              <p className="text-xs text-ui-muted truncate">{user.email}</p>
            )}
            <p className="text-xs text-aoz-primary mt-1">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>

          {hasPortalAccess && (
            <Link
              href="/portal"
              onClick={() => setIsOpen(false)}
    className="w-full px-4 py-3 text-left text-sm text-ui-muted hover:text-ui-text hover:bg-ui-subtle flex items-center gap-2 min-h-[44px]"
            >
              <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
              {UI_LABELS.switchToPortal}
            </Link>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
className="w-full px-4 py-3 text-left text-sm text-ui-muted hover:text-ui-text hover:bg-ui-subtle disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {isLoggingOut ? UI_LABELS.loggingOut : UI_LABELS.logout}
          </button>
        </div>
      )}
    </div>
  )
}
