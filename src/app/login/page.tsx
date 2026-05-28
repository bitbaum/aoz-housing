'use client'

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react'
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [state, setState] = useState<LoginState>({ status: 'idle' })
  const demoAccessEnabled = process.env.NEXT_PUBLIC_DEMO_ACCESS_ENABLED === 'true'
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-fill code from URL param (used by email invite links)
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) setCode(urlCode.toUpperCase())
  }, [searchParams])

  // Clear any pending redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  function scheduleRedirect(role: 'staff' | 'resident') {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    redirectTimerRef.current = setTimeout(() => {
      router.push(role === 'staff' ? '/' : '/portal')
      router.refresh()
    }, 1000)
  }

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
      scheduleRedirect(data.type)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await submitCode(code)
  }

  async function submitDemo(role: 'staff' | 'resident') {
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
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
      scheduleRedirect(data.type)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
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
              <div className="alert-error" role="alert" aria-live="polite">
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
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
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

      {demoAccessEnabled && state.status !== 'success' ? (
        <div className="mt-4 rounded-lg border border-ui-border bg-ui-surface p-4 shadow-card">
          <div className="mb-3">
            <p className="text-sm font-medium text-ui-text">{LOGIN_LABELS.demo.title}</p>
            <p className="mt-0.5 text-xs text-ui-muted">{LOGIN_LABELS.demo.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              onClick={() => submitDemo('staff')}
              disabled={state.status === 'loading'}
              variant="secondary"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LOGIN_LABELS.demo.staff}
            </Button>
            <Button
              onClick={() => submitDemo('resident')}
              disabled={state.status === 'loading'}
              variant="outline"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LOGIN_LABELS.demo.resident}
            </Button>
          </div>
        </div>
      ) : null}
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
