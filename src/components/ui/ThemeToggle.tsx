'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './Button'

type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'aoz-theme'

const modes: ThemeMode[] = ['system', 'light', 'dark']

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.dataset.theme = mode
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initial = stored && modes.includes(stored) ? stored : 'system'
    setMode(initial)
    applyTheme(initial)
  }, [])

  const nextMode = () => {
    const next = modes[(modes.indexOf(mode) + 1) % modes.length]
    setMode(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor
  const label = mode === 'dark' ? 'Dunkles Design' : mode === 'light' ? 'Helles Design' : 'Systemdesign'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={nextMode}
      className={className}
      aria-label={`${label} wechseln`}
      title={`${label} wechseln`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  )
}
