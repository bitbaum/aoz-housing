/**
 * Filter bar component for list pages
 */

'use client'

import { useId } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface SelectFilterProps {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  className?: string
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  className = '',
}: SelectFilterProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Suchen...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pl-10 text-sm"
      />
    </div>
  )
}

interface FilterBarProps {
  children: React.ReactNode
  className?: string
}

export function FilterBar({ children, className = '' }: FilterBarProps) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>
}
