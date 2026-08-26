'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavProps {
  sections: Array<{ id: string; path: string; label: string; emoji: string }>
}

function isActive(pathname: string, path: string): boolean {
  return path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)
}

export function AdminNav({ sections }: AdminNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = sections.find((s) => isActive(pathname, s.path)) ?? sections[0]

  return (
    <>
      {/* Mobile: a toggle showing the current section, expanding into a dropdown menu. */}
      <div className="relative lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-[44px] w-full items-center justify-between rounded border border-line bg-surface px-4 py-2 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>{current?.emoji}</span>
            {current?.label ?? 'Menu'}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <nav className="absolute inset-x-0 top-full z-10 mt-1 rounded border border-line bg-surface shadow-lifted">
            {sections.map((section) => {
              const active = isActive(pathname, section.path)
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm font-medium first:rounded-t last:rounded-b ${
                    active ? 'bg-gold-50 text-gold-700' : 'text-muted hover:bg-subtle'
                  }`}
                >
                  <span aria-hidden>{section.emoji}</span>
                  {section.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      {/* Desktop: a plain vertical sidebar list. */}
      <nav className="mt-4 hidden flex-col lg:flex">
        {sections.map((section) => {
          const active = isActive(pathname, section.path)
          return (
            <Link
              key={section.id}
              href={section.path}
              className={`flex min-h-[44px] items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-gold-50 text-gold-700' : 'text-muted hover:bg-subtle'
              }`}
            >
              <span aria-hidden>{section.emoji}</span>
              {section.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
