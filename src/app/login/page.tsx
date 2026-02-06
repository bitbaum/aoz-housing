'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LOGIN_LABELS, APP_LABELS } from '@/lib/constants/labels'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || LOGIN_LABELS.error.generic)
        setIsLoading(false)
        return
      }

      // Redirect to dashboard on success
      router.push('/')
      router.refresh()
    } catch {
      setError(LOGIN_LABELS.error.generic)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo/Branding */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-aoz-primary font-bold text-4xl tracking-tight">AOZ</span>
          <span className="text-aoz-secondary font-semibold text-2xl">Wohnen</span>
        </div>
        <p className="text-gray-500">{APP_LABELS.tagline}</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          {LOGIN_LABELS.title}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary
                       placeholder:text-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {LOGIN_LABELS.password}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={LOGIN_LABELS.passwordPlaceholder}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary
                       placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-aoz-primary text-white font-medium rounded-md
                     hover:bg-aoz-primary/90 focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors min-h-[44px]"
          >
            {isLoading ? LOGIN_LABELS.submitting : LOGIN_LABELS.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          {LOGIN_LABELS.help}
        </p>
      </div>
    </div>
  )
}
