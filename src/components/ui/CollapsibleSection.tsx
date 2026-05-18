'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const sectionId = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`card ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between min-h-[44px] focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
        aria-controls={`section-${sectionId}`}
      >
        <h3 className="font-semibold text-ui-text">{title}</h3>
        <svg
          className={`w-5 h-5 text-ui-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div id={`section-${sectionId}`} className="mt-3">{children}</div>}
    </div>
  )
}
