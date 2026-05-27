/**
 * Tab navigation components
 */

'use client'

import Link from 'next/link'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-ui-border bg-ui-surface p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          id={`tab-${tab.id}`}
          aria-controls={`tabpanel-${tab.id}`}
          className={`rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-ui-text text-ui-inverse'
              : 'text-ui-muted hover:bg-ui-subtle hover:text-ui-text'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs bg-ui-subtle px-2 py-0.5 rounded-md">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface TabButtonProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}

export function TabButton({ children, active = false, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap ${
        active
          ? 'bg-ui-text text-ui-inverse'
          : 'text-ui-muted hover:bg-ui-subtle hover:text-ui-text'
      }`}
    >
      {children}
    </button>
  )
}

interface StaticTabsProps {
  children: React.ReactNode
}

export function StaticTabs({ children }: StaticTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-ui-border bg-ui-surface p-1" role="tablist">
      {children}
    </div>
  )
}

// =============================================================================
// TabLink - For URL-based tab navigation (server components)
// =============================================================================

interface TabLinkProps {
  href: string
  label: string
  count?: number
  active?: boolean
}

export function TabLink({ href, label, count, active = false }: TabLinkProps) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap ${
        active
          ? 'bg-ui-text text-ui-inverse'
          : 'text-ui-muted hover:bg-ui-subtle hover:text-ui-text'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${active ? 'bg-ui-inverse/10' : 'bg-ui-subtle'}`}>
          {count}
        </span>
      )}
    </Link>
  )
}

// =============================================================================
// TabPanel - Content area for a tab (accessibility wrapper)
// =============================================================================

interface TabPanelProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ id, children, className = '' }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={className}
    >
      {children}
    </div>
  )
}
