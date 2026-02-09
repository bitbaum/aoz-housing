'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LOGIN_LABELS, APP_LABELS } from '@/lib/constants/labels'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  async function handleLogin(e: FormEvent) {
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

      router.push('/')
      router.refresh()
    } catch {
      setError(LOGIN_LABELS.error.generic)
      setIsLoading(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          inviteCode,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || LOGIN_LABELS.register.error.generic)
        setIsLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError(LOGIN_LABELS.register.error.generic)
      setIsLoading(false)
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setError('')
    setIsLoading(false)
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

      {/* Login/Register Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        {/* Tab Toggle */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 pb-3 text-sm font-medium text-center transition-colors min-h-[44px] ${
              mode === 'login'
                ? 'text-aoz-primary border-b-2 border-aoz-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {LOGIN_LABELS.tabs.login}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 pb-3 text-sm font-medium text-center transition-colors min-h-[44px] ${
              mode === 'register'
                ? 'text-aoz-primary border-b-2 border-aoz-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {LOGIN_LABELS.tabs.register}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
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
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {LOGIN_LABELS.register.name}
              </label>
              <input
                type="text"
                id="reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={LOGIN_LABELS.register.namePlaceholder}
                required
                autoComplete="name"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary
                         placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {LOGIN_LABELS.register.email}
              </label>
              <input
                type="email"
                id="reg-email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder={LOGIN_LABELS.register.emailPlaceholder}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary
                         placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {LOGIN_LABELS.register.password}
              </label>
              <input
                type="password"
                id="reg-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={LOGIN_LABELS.register.passwordPlaceholder}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary
                         placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {LOGIN_LABELS.register.inviteCode}
              </label>
              <input
                type="text"
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={LOGIN_LABELS.register.inviteCodePlaceholder}
                required
                autoComplete="off"
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
              {isLoading ? LOGIN_LABELS.register.submitting : LOGIN_LABELS.register.submit}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/portal"
            className="text-sm text-aoz-secondary hover:text-aoz-secondary/80 transition-colors"
          >
            {LOGIN_LABELS.portalLink}
          </Link>
        </div>
      </div>
    </div>
  )
}
