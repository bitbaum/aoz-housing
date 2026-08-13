'use client'

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AuthShell, AuthSuccess } from '@/components/auth/AuthShell'
import { LOGIN_LABELS } from '@/lib/constants/labels'

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; type: 'staff' | 'resident'; message: string }
  | { status: 'error'; message: string }

type LoginMode = 'email' | 'code'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Email + password is the primary door; an invite link with ?code= opens
  // the code form directly so the invited person just presses Anmelden.
  const [mode, setMode] = useState<LoginMode>(searchParams.get('code') ? 'code' : 'email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [state, setState] = useState<LoginState>({ status: 'idle' })
  // Which demo doors this deployment offers — server truth, not a build-baked
  // flag, so a button only appears when pressing it can succeed.
  const [demoRoles, setDemoRoles] = useState<{ staff: boolean; resident: boolean }>({
    staff: false,
    resident: false,
  })
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/demo')
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body?.success) setDemoRoles(body.data)
      })
      .catch(() => {
        // No demo section on failure — the login form is unaffected.
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  // Outcome banners from email flows (verification link, password reset).
  const verified = searchParams.get('verified')
  const resetDone = searchParams.get('reset') === '1'

  function scheduleRedirect(role: 'staff' | 'resident') {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    redirectTimerRef.current = setTimeout(() => {
      router.push(role === 'staff' ? '/' : '/portal')
      router.refresh()
    }, 1000)
  }

  async function submitLogin(body: Record<string, string>) {
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        setState({ status: 'error', message: data.error || LOGIN_LABELS.error.generic })
        return
      }

      const successMessage =
        data.type === 'staff' ? LOGIN_LABELS.success.staff : LOGIN_LABELS.success.resident

      setState({ status: 'success', type: data.type, message: successMessage })
      scheduleRedirect(data.type)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'email') {
      await submitLogin({ email: email.trim(), password })
    } else {
      await submitLogin({ code: code.trim() })
    }
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

      const successMessage =
        data.type === 'staff' ? LOGIN_LABELS.success.staff : LOGIN_LABELS.success.resident

      setState({ status: 'success', type: data.type, message: successMessage })
      scheduleRedirect(data.type)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
  }

  const demoFooter =
    (demoRoles.staff || demoRoles.resident) && state.status !== 'success' ? (
      <div className="mt-4 rounded-lg border border-ui-border bg-ui-surface p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-ui-text">{LOGIN_LABELS.demo.title}</p>
          <p className="mt-0.5 text-xs text-ui-muted">{LOGIN_LABELS.demo.description}</p>
        </div>
        <div
          className={`grid grid-cols-1 gap-2 ${demoRoles.staff && demoRoles.resident ? 'sm:grid-cols-2' : ''}`}
        >
          {demoRoles.staff && (
            <Button
              onClick={() => submitDemo('staff')}
              disabled={state.status === 'loading'}
              variant="secondary"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LOGIN_LABELS.demo.staff}
            </Button>
          )}
          {demoRoles.resident && (
            <Button
              onClick={() => submitDemo('resident')}
              disabled={state.status === 'loading'}
              variant="outline"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LOGIN_LABELS.demo.resident}
            </Button>
          )}
        </div>
      </div>
    ) : null

  return (
    <AuthShell
      title={LOGIN_LABELS.title}
      subtitle={mode === 'email' ? LOGIN_LABELS.subtitle : LOGIN_LABELS.codeSubtitle}
      footer={demoFooter}
    >
      {state.status === 'success' ? (
        <AuthSuccess message={state.message} detail={LOGIN_LABELS.success.redirecting} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {verified === '1' && (
            <div className="alert-success" role="status">
              {LOGIN_LABELS.emailVerified}
            </div>
          )}
          {verified === '0' && (
            <div className="alert-warning" role="status">
              {LOGIN_LABELS.emailVerifyFailed}
            </div>
          )}
          {resetDone && (
            <div className="alert-success" role="status">
              {LOGIN_LABELS.passwordResetDone}
            </div>
          )}
          {state.status === 'error' && (
            <div className="alert-error" role="alert" aria-live="polite">
              {state.message}
            </div>
          )}

          {mode === 'email' ? (
            <>
              <div>
                <label htmlFor="email" className="label">
                  {LOGIN_LABELS.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={LOGIN_LABELS.emailPlaceholder}
                  required
                  autoComplete="email"
                  autoFocus
                  className="input"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="password" className="label">
                    {LOGIN_LABELS.password}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-ui-muted underline-offset-2 hover:text-ui-text hover:underline"
                  >
                    {LOGIN_LABELS.forgotPassword}
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input"
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="code" className="label">
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
          )}

          <Button
            type="submit"
            disabled={state.status === 'loading'}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.status === 'loading' ? LOGIN_LABELS.submitting : LOGIN_LABELS.submit}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'email' ? 'code' : 'email')
                setState({ status: 'idle' })
              }}
              className="min-h-[44px] text-ui-muted underline-offset-2 hover:text-ui-text hover:underline"
            >
              {mode === 'email' ? LOGIN_LABELS.useCode : LOGIN_LABELS.useEmail}
            </button>
            <span className="text-ui-muted">
              {LOGIN_LABELS.noAccount}{' '}
              <Link
                href="/register"
                className="font-medium text-ui-text underline underline-offset-2"
              >
                {LOGIN_LABELS.registerLink}
              </Link>
            </span>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-ui-muted">{LOGIN_LABELS.help}</p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
