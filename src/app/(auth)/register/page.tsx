'use client'

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AuthShell, AuthSuccess } from '@/components/auth/AuthShell'
import { LOGIN_LABELS, REGISTER_LABELS } from '@/lib/constants/labels'

type RegisterState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; type: 'staff' | 'resident' }
  | { status: 'error'; message: string }

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<RegisterState>({ status: 'idle' })
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Invite links can pre-fill the code (same param as /login).
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) setCode(urlCode.toUpperCase())
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email.trim(), password }),
      })
      const data = await response.json()

      if (!data.success) {
        setState({ status: 'error', message: data.error || LOGIN_LABELS.error.generic })
        return
      }

      setState({ status: 'success', type: data.type })
      redirectTimerRef.current = setTimeout(() => {
        router.push(data.type === 'staff' ? '/' : '/portal')
        router.refresh()
      }, 1000)
    } catch {
      setState({ status: 'error', message: LOGIN_LABELS.error.generic })
    }
  }

  return (
    <AuthShell title={REGISTER_LABELS.title} subtitle={REGISTER_LABELS.subtitle}>
      {state.status === 'success' ? (
        <AuthSuccess message={REGISTER_LABELS.success} detail={LOGIN_LABELS.success.redirecting} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {state.status === 'error' && (
            <div className="alert-error" role="alert" aria-live="polite">
              {state.message}
            </div>
          )}

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
              className="input font-mono"
            />
            <p className="mt-1.5 text-xs text-ui-muted">{REGISTER_LABELS.codeHint}</p>
          </div>

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
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              {LOGIN_LABELS.password}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
            />
            <p className="mt-1.5 text-xs text-ui-muted">{REGISTER_LABELS.passwordHint}</p>
          </div>

          <Button
            type="submit"
            disabled={state.status === 'loading'}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.status === 'loading' ? REGISTER_LABELS.submitting : REGISTER_LABELS.submit}
          </Button>

          <p className="text-center text-sm text-ui-muted">
            {REGISTER_LABELS.hasAccount}{' '}
            <Link href="/login" className="font-medium text-ui-text underline underline-offset-2">
              {REGISTER_LABELS.loginLink}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
