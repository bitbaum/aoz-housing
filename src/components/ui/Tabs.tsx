/**
 * Tab navigation components
 */

'use client'

import { useState } from 'react'
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
    <div className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] inline-flex items-center ${
            activeTab === tab.id
              ? 'border-aoz-primary text-aoz-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
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
      className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] inline-flex items-center ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
    <div className="flex gap-1 border-b border-gray-200">
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
      className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] inline-flex items-center ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </Link>
  )
}
