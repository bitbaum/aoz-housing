'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { NAV_ICONS, MEGAMENU_GROUPS } from '@/lib/config/navigation'
import { useDismissable } from '@/lib/hooks/useDismissable'

export function MegaMenuItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  const Icon = NAV_ICONS[icon] || NAV_ICONS.home
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors duration-150 min-h-[40px] whitespace-nowrap"
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </Link>
  )
}

export function MegaMenuDropdown({
  label,
  items,
}: {
  label: string
  items: { href: string; label: string; desc: string }[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useDismissable<HTMLDivElement>(isOpen, () => setIsOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors duration-150 min-h-[40px] whitespace-nowrap"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full pt-1.5 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border py-1 min-w-[240px]">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 hover:bg-ui-subtle transition-colors min-h-[44px] flex flex-col justify-center"
              >
                <div className="font-medium text-ui-text text-sm leading-tight">{item.label}</div>
                <div className="text-xs text-ui-muted mt-0.5">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminMegaMenu() {
  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {MEGAMENU_GROUPS.map((group) =>
        'items' in group ? (
          <MegaMenuDropdown key={group.label} label={group.label} items={group.items} />
        ) : (
          <MegaMenuItem key={group.href} href={group.href} icon={group.icon} label={group.label} />
        )
      )}
    </nav>
  )
}
