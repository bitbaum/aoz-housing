'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LOGIN_LABELS, APP_LABELS } from '@/lib/constants/labels'

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; type: 'staff' | 'resident'; message: string }
  | { status: 'error'; message: string }

const DEMO_ADMIN_CODE = 'AOZ-ADMIN1'
const DEMO_RESIDENT_CODE = 'RES-001'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [state, setState] = useState<LoginState>({ status: 'idle' })

  // Pre-fill code from URL param (used by email invite links)
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) setCode(urlCode.toUpperCase())
  }, [searchParams])

  async function submitCode(codeToSubmit: string) {
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToSubmit.trim() }),
      })

      const data = await response.json()

      if (!data.success) {
        setState({ status: 'error', message: data.error || LOGIN_LABELS.error.generic })
        return
      }

      const successMessage = data.type === 'staff'
        ? LOGIN_LABELS.success.staff
        : LOGIN_LABELS.success.resident

      setState({ status: 'success', type: data.type, message: successMessage })

      setTimeout(() => {
        if (data.type === 'staff') {
          router.push('/')
        } else {
          router.push('/portal')
        }
        router.refresh()
      }, 1000)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await submitCode(code)
  }

  async function handleDemoAdmin() {
    setCode(DEMO_ADMIN_CODE)
    await submitCode(DEMO_ADMIN_CODE)
  }

  async function handleDemoResident() {
    setCode(DEMO_RESIDENT_CODE)
    await submitCode(DEMO_RESIDENT_CODE)
  }

  return (
    <div className="w-full max-w-md">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>

      {/* Logo/Branding */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-2">
          <Logo size="xl" />
        </div>
        <p className="text-ui-muted">{APP_LABELS.tagline}</p>
      </div>

      {/* Login Card */}
      <div className="card p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-ui-text mb-1 text-center">
          {LOGIN_LABELS.title}
        </h1>
        <p className="text-sm text-ui-muted mb-6 text-center">
          {LOGIN_LABELS.subtitle}
        </p>

        {state.status === 'success' ? (
          <div className="text-center py-4" role="status" aria-live="polite">
            <div className="w-12 h-12 mx-auto mb-3 rounded-md bg-status-success/15 ring-1 ring-status-success/25 flex items-center justify-center">
              <svg className="w-6 h-6 text-status-success-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-status-success-text font-medium">{state.message}</p>
            <p className="text-sm text-ui-muted mt-2">{LOGIN_LABELS.success.redirecting}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {state.status === 'error' && (
              <div className="p-3 bg-status-error/8 border border-status-error/25 rounded-lg text-status-error-text text-sm" role="alert" aria-live="polite">
                {state.message}
              </div>
            )}

            <div>
              <label htmlFor="code" className="label" >
                {LOGIN_LABELS.code}
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={LOGIN_LABELS.codePlaceholder}
                required
                autoComplete="off"
                autoFocus={!searchParams.get('code')}
                className="input font-mono text-center text-lg tracking-wider"
              />
              <p className="mt-1.5 text-xs text-ui-muted">{LOGIN_LABELS.codeHint}</p>
            </div>

            <Button
              type="submit"
              disabled={state.status === 'loading'}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.status === 'loading' ? LOGIN_LABELS.submitting : LOGIN_LABELS.submit}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ui-muted">
          {LOGIN_LABELS.help}
        </p>
      </div>

      {/* Demo access */}
      {state.status !== 'success' && (
        <div className="mt-4 bg-ui-surface border border-ui-border rounded-lg p-4 shadow-card">
          <div className="flex items-start gap-3">
            <span className="text-status-warning-text text-lg leading-none mt-0.5" aria-hidden="true">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-status-warning-text">{LOGIN_LABELS.demo.title}</p>
              <p className="text-xs text-ui-muted mt-0.5">Erkunden Sie die Anwendung aus beiden Perspektiven.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleDemoAdmin}
              disabled={state.status === 'loading'}
              variant="secondary"
              className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🏢 AOZ-Verwaltung
            </Button>
            <Button
              onClick={handleDemoResident}
              disabled={state.status === 'loading'}
              variant="outline"
              className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👤 Bewohner-Portal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
