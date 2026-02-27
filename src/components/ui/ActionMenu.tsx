'use client'

import { useState, useRef, useEffect } from 'react'
import { CRUD_ACTIONS, ACTION_ICONS } from '@/lib/config/crud-actions'

interface ActionMenuProps {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  deleteLabel?: string
  size?: 'sm' | 'md'
}

function ActionIcon({ name, className }: { name: keyof typeof ACTION_ICONS; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={ACTION_ICONS[name]} />
    </svg>
  )
}

export function ActionMenu({
  onEdit,
  onDuplicate,
  onDelete,
  deleteLabel,
  size = 'md',
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const hasActions = onEdit || onDuplicate || onDelete
  if (!hasActions) return null

  const sizeClasses = size === 'sm' ? 'w-8 h-8 min-w-[44px] min-h-[44px]' : 'w-10 h-10 min-w-[44px] min-h-[44px]'
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`${sizeClasses} flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-1`}
        aria-label="Aktionen"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <ActionIcon name="ellipsis" className={iconSize} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 animate-in"
          role="menu"
        >
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onEdit()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              role="menuitem"
            >
              <ActionIcon name="pencil" className="w-4 h-4" />
              {CRUD_ACTIONS.edit.label}
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onDuplicate()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              role="menuitem"
            >
              <ActionIcon name="copy" className="w-4 h-4" />
              {CRUD_ACTIONS.duplicate.label}
            </button>
          )}

          {(onEdit || onDuplicate) && onDelete && (
            <div className="my-1 border-t border-gray-100" />
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onDelete()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              <ActionIcon name="trash" className="w-4 h-4" />
              {deleteLabel || CRUD_ACTIONS.delete.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
