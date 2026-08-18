'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavProps {
  sections: Array<{ id: string; path: string; label: string; emoji: string }>
}

export function AdminNav({ sections }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="mt-0 flex gap-1 overflow-x-auto lg:mt-4 lg:flex-col lg:overflow-visible">
      {sections.map((section) => {
        const active =
          section.path === '/admin' ? pathname === '/admin' : pathname.startsWith(section.path)
        return (
          <Link
            key={section.id}
            href={section.path}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-gold-50 text-gold-700' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <span aria-hidden>{section.emoji}</span>
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
