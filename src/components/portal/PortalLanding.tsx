'use client'

import { useState } from 'react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'

interface PortalLandingProps {
  error?: string
}

const loginErrorMessages: Record<string, string> = {
  code_required: PORTAL_LABELS.login.errors.code_required,
  invalid_code: PORTAL_LABELS.login.errors.invalid_code,
  rate_limited: PORTAL_LABELS.login.errors.rate_limited,
  account_not_found: PORTAL_LABELS.login.errors.account_not_found,
}

const LANGUAGE_OPTIONS = (RESIDENT_FACTORS.languages as { options: readonly string[]; optionLabels: Record<string, string> }).options.slice(0, 6)
const LANGUAGE_LABELS = (RESIDENT_FACTORS.languages as { optionLabels: Record<string, string> }).optionLabels

function getEnumOptions(factorId: string) {
  const factor = RESIDENT_FACTORS[factorId] as { options: readonly string[]; optionLabels: Record<string, string> }
  return { options: factor.options, labels: factor.optionLabels }
}

type RegisterState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; code: string }
  | { status: 'error'; message: string }

export function PortalLanding({ error }: PortalLandingProps) {
  const [registerState, setRegisterState] = useState<RegisterState>({ status: 'idle' })
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  const loginError = error ? (loginErrorMessages[error] || error) : undefined

  const ageRange = getEnumOptions('ageRange')
  const gender = getEnumOptions('gender')
  const familyStatus = getEnumOptions('familyStatus')

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegisterState({ status: 'loading' })

    const form = e.currentTarget
    const formData = new FormData(form)

    const body = {
      ageRange: formData.get('ageRange'),
      gender: formData.get('gender'),
      familyStatus: formData.get('familyStatus'),
      languages: selectedLanguages,
    }

    try {
      const res = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setRegisterState({ status: 'error', message: data.error || PORTAL_LABELS.form.errorGeneric })
        return
      }

      setRegisterState({ status: 'success', code: data.code })

      setTimeout(() => {
        window.location.href = '/portal'
      }, 2500)
    } catch {
      setRegisterState({ status: 'error', message: PORTAL_LABELS.form.errorGeneric })
    }
  }

  function toggleLanguage(lang: string) {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    )
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-aoz-secondary text-white px-4 py-12 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            {PORTAL_LABELS.landing.hero}
          </h1>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed">
            {PORTAL_LABELS.landing.heroSubtitle}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 -mt-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PORTAL_LABELS.landing.features.map((feature) => (
            <div
              key={feature.title}
              className="card text-center"
            >
              <span className="text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Login + Register */}
      <div className="px-4 pt-8 sm:pt-10 pb-10 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Login */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {PORTAL_LABELS.landing.loginTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {PORTAL_LABELS.landing.loginDesc}
            </p>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <form action="/api/portal/login" method="POST">
              <input
                type="text"
                name="code"
                placeholder={PORTAL_LABELS.login.placeholder}
                className="input mb-3"
                required
              />
              <button type="submit" className="btn-primary w-full min-h-[44px]">
                {PORTAL_LABELS.login.submit}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-3">
              {PORTAL_LABELS.login.hint}
            </p>
          </div>

          {/* Register */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {PORTAL_LABELS.landing.registerTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {PORTAL_LABELS.landing.registerDesc}
            </p>

            {registerState.status === 'success' ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-2">{PORTAL_LABELS.landing.registerSuccess}</p>
                <p className="text-2xl font-bold text-aoz-primary font-mono">{registerState.code}</p>
                <p className="text-xs text-gray-400 mt-3">{PORTAL_LABELS.login.hint}</p>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                {registerState.status === 'error' && (
                  <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {registerState.message}
                  </div>
                )}

                <SelectField
                  name="ageRange"
                  label={PORTAL_LABELS.landing.registerAgeRange}
                  options={ageRange.options}
                  labels={ageRange.labels}
                  required
                />

                <SelectField
                  name="gender"
                  label={PORTAL_LABELS.landing.registerGender}
                  options={gender.options}
                  labels={gender.labels}
                  required
                />

                <SelectField
                  name="familyStatus"
                  label={PORTAL_LABELS.landing.registerFamilyStatus}
                  options={familyStatus.options}
                  labels={familyStatus.labels}
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {PORTAL_LABELS.landing.registerLanguages}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] transition-colors ${
                          selectedLanguages.includes(lang)
                            ? 'bg-aoz-secondary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registerState.status === 'loading'}
                  className="btn-primary w-full min-h-[44px] disabled:opacity-50"
                >
                  {registerState.status === 'loading'
                    ? PORTAL_LABELS.landing.registerCreating
                    : PORTAL_LABELS.landing.registerButton}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectField({
  name,
  label,
  options,
  labels,
  required,
}: {
  name: string
  label: string
  options: readonly string[]
  labels: Record<string, string>
  required?: boolean
}) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        className="input"
        defaultValue=""
      >
        <option value="" disabled>
          {PORTAL_LABELS.landing.registerSelectPlaceholder}
        </option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {labels[opt]}
          </option>
        ))}
      </select>
    </div>
  )
}
