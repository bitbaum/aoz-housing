'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { LOGIN_LABELS, APP_LABELS } from '@/lib/constants/labels'

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; type: 'staff' | 'resident'; message: string }
  | { status: 'error'; message: string }

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [state, setState] = useState<LoginState>({ status: 'idle' })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
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

      // Redirect after brief delay to show success
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

  return (
    <div className="w-full max-w-md">
      {/* Logo/Branding */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-2">
          <Logo size="xl" />
        </div>
        <p className="text-gray-500">{APP_LABELS.tagline}</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">
          {LOGIN_LABELS.title}
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {LOGIN_LABELS.subtitle}
        </p>

        {state.status === 'success' ? (
          <div className="text-center py-4" role="status" aria-live="polite">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium">{state.message}</p>
            <p className="text-sm text-gray-500 mt-2">{LOGIN_LABELS.success.redirecting}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {state.status === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert" aria-live="polite">
                {state.message}
              </div>
            )}

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {LOGIN_LABELS.code}
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={LOGIN_LABELS.codePlaceholder}
                required
                autoComplete="off"
                autoFocus
                className="input placeholder:text-gray-400 font-mono text-center text-lg tracking-wider"
              />
              <p className="mt-1.5 text-xs text-gray-500">{LOGIN_LABELS.codeHint}</p>
            </div>

            <button
              type="submit"
              disabled={state.status === 'loading'}
              className="w-full py-2.5 px-4 bg-aoz-primary text-white font-medium rounded-md
                       hover:bg-aoz-primary/90 focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors min-h-[44px]"
            >
              {state.status === 'loading' ? LOGIN_LABELS.submitting : LOGIN_LABELS.submit}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          {LOGIN_LABELS.help}
        </p>
      </div>
    </div>
  )
}
