'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROLE_LABELS, UI_LABELS } from '@/lib/constants/labels'

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
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-aoz-secondary"
        aria-label={UI_LABELS.userMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar circle */}
        <div className="w-8 h-8 rounded-full bg-aoz-primary flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        {/* Name - hidden on small screens */}
        <span className="hidden lg:block text-sm text-white/90">{user.name}</span>
        {/* Dropdown arrow */}
        <svg className="w-4 h-4 text-white/70" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            {user.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
            <p className="text-xs text-aoz-primary mt-1">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>

          {/* Role switcher — portal link */}
          {hasPortalAccess && (
            <Link
              href="/portal"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50
                       flex items-center gap-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {UI_LABELS.switchToPortal}
            </Link>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLoggingOut ? UI_LABELS.loggingOut : UI_LABELS.logout}
          </button>
        </div>
      )}
    </div>
  )
}
