'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CEFR_LEVELS,
  LEARNING_CATEGORIES,
  LEARNING_CATEGORY_LABELS,
  LEARNING_KIND_LABELS,
  LEARNING_LABELS,
  LEARNING_LANGUAGE_OPTIONS,
  LEARNING_STATUS_LABELS,
  kindTracksHours,
} from '@/lib/config/learning'
import { showToast } from '@/components/ui/Toast'

interface Props {
  action: (formData: FormData) => Promise<unknown>
  residentId?: string
  submitLabel?: string
  audience?: 'resident' | 'staff'
  /** Shown after a successful save (resident portal). */
  successMessage?: string
  /** Overrides default staff save error copy. */
  errorMessage?: string
}

export function LearningForm({
  action,
  residentId,
  submitLabel,
  audience = 'staff',
  successMessage,
  errorMessage,
}: Props) {
  const router = useRouter()
  const [kind, setKind] = useState('COURSE')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLanguageTest = kind === 'LANGUAGE_TEST'
  const showHours = kindTracksHours(kind)
  const residentMode = audience === 'resident'

  const saveErrorCopy = errorMessage ?? LEARNING_LABELS.saveError

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      const result = await action(formData)
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        setError(String((result as { error?: string }).error || saveErrorCopy))
        return
      }
      if (successMessage) {
        showToast('success', successMessage)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : saveErrorCopy)
      return
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {residentId && <input type="hidden" name="residentId" value={residentId} />}
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      {residentMode && (
        <div className="rounded-lg border border-ui-border bg-ui-subtle p-3">
          <p className="text-sm text-ui-text mb-2">{LEARNING_LABELS.evidenceHelp}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={kind === 'COURSE'}
              className={`min-h-[44px] rounded-full border px-4 text-sm ${
                kind === 'COURSE'
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-ui-border text-ui-text hover:border-brand-primary/30'
              }`}
              onClick={() => setKind('COURSE')}
            >
              {LEARNING_LABELS.evidenceQuickCourse}
            </button>
            <button
              type="button"
              aria-pressed={kind === 'LANGUAGE_TEST'}
              className={`min-h-[44px] rounded-full border px-4 text-sm ${
                kind === 'LANGUAGE_TEST'
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-ui-border text-ui-text hover:border-brand-primary/30'
              }`}
              onClick={() => setKind('LANGUAGE_TEST')}
            >
              {LEARNING_LABELS.evidenceQuickLanguage}
            </button>
            <button
              type="button"
              aria-pressed={kind === 'VOLUNTEERING'}
              className={`min-h-[44px] rounded-full border px-4 text-sm ${
                kind === 'VOLUNTEERING'
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-ui-border text-ui-text hover:border-brand-primary/30'
              }`}
              onClick={() => setKind('VOLUNTEERING')}
            >
              {LEARNING_LABELS.evidenceQuickVolunteering}
            </button>
            <button
              type="button"
              aria-pressed={kind === 'QUALIFICATION'}
              className={`min-h-[44px] rounded-full border px-4 text-sm ${
                kind === 'QUALIFICATION'
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-ui-border text-ui-text hover:border-brand-primary/30'
              }`}
              onClick={() => setKind('QUALIFICATION')}
            >
              {LEARNING_LABELS.evidenceQuickQualification}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="learning-kind" className="label">
            {LEARNING_LABELS.kind}
          </label>
          <select
            id="learning-kind"
            name="kind"
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {Object.entries(LEARNING_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="learning-status" className="label">
            {LEARNING_LABELS.status}
          </label>
          <select id="learning-status" name="status" className="input" defaultValue="IN_PROGRESS">
            {Object.entries(LEARNING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="learning-title" className="label">
          {LEARNING_LABELS.titleField}
        </label>
        <input
          id="learning-title"
          name="title"
          required
          minLength={2}
          className="input"
          placeholder={LEARNING_LABELS.titlePlaceholder}
        />
      </div>

      {isLanguageTest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="learning-language" className="label">
              {LEARNING_LABELS.language}
            </label>
            <select id="learning-language" name="languageCode" className="input" defaultValue="DE">
              {LEARNING_LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="learning-cefr" className="label">
              {LEARNING_LABELS.cefr}
            </label>
            <select id="learning-cefr" name="cefrLevel" className="input" defaultValue="A1">
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="learning-provider" className="label">
            {LEARNING_LABELS.provider}
          </label>
          <input
            id="learning-provider"
            name="provider"
            className="input"
            placeholder={LEARNING_LABELS.providerPlaceholder}
          />
        </div>
        <div>
          <label htmlFor="learning-category" className="label">
            {LEARNING_LABELS.category}
          </label>
          <select id="learning-category" name="category" className="input" defaultValue="language">
            {LEARNING_CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {LEARNING_CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showHours && (
        <div>
          <label htmlFor="learning-hours" className="label">
            {LEARNING_LABELS.hours}
          </label>
          <input
            id="learning-hours"
            name="hours"
            type="number"
            min={0}
            step={1}
            className="input"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="learning-startedAt" className="label">
            {LEARNING_LABELS.startedAt}
          </label>
          <input id="learning-startedAt" name="startedAt" type="date" className="input" />
        </div>
        <div>
          <label htmlFor="learning-completedAt" className="label">
            {LEARNING_LABELS.completedAt}
          </label>
          <input id="learning-completedAt" name="completedAt" type="date" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="learning-notes" className="label">
          {LEARNING_LABELS.notes}
        </label>
        <textarea id="learning-notes" name="notes" rows={2} className="input" />
        <p className="text-xs text-ui-muted mt-1">{LEARNING_LABELS.notesHint}</p>
      </div>

      <button type="submit" className="btn-primary min-h-[44px]" disabled={pending}>
        {pending ? LEARNING_LABELS.saving : submitLabel || LEARNING_LABELS.save}
      </button>
    </form>
  )
}
