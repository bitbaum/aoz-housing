'use client'

/**
 * AI assistance bar for a form.
 *
 * Generic over any `useAiForm` store, so a second assisted form needs no
 * changes here. It renders nothing app-specific beyond labels: the intent
 * (fill an empty form vs. change a filled one) is inferred by the hook, and
 * this only reflects it back so the user can see which one they are about to
 * do.
 */

import { useState } from 'react'
import type { UseAiForm } from '@fleet/ai-forms/react'
import { AI_FORM_LABELS } from '@/lib/constants'

interface AiFormBarProps {
  form: UseAiForm
  fillPlaceholder?: string
  refinePlaceholder?: string
}

export function AiFormBar({ form, fillPlaceholder, refinePlaceholder }: AiFormBarProps) {
  const [instruction, setInstruction] = useState('')
  const isFill = form.isEmpty

  const title = isFill ? AI_FORM_LABELS.fillTitle : AI_FORM_LABELS.refineTitle
  const hint = isFill ? AI_FORM_LABELS.fillHint : AI_FORM_LABELS.refineHint
  const submit = isFill ? AI_FORM_LABELS.fillSubmit : AI_FORM_LABELS.refineSubmit
  const placeholder =
    (isFill ? fillPlaceholder : refinePlaceholder) ??
    (isFill ? AI_FORM_LABELS.fillPlaceholder : AI_FORM_LABELS.refinePlaceholder)

  async function run() {
    if (form.busy || instruction.trim() === '') return
    const result = await form.ask(instruction)
    // Only clear on success — a failed instruction is the one the user most
    // wants to edit and retry, not retype from memory.
    if (result.ok) setInstruction('')
  }

  return (
    <div className="card border-brand-primary/30">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-ui-text">{title}</h2>
        {form.canUndo && (
          <button
            type="button"
            onClick={form.undo}
            disabled={form.busy}
            className="btn-ghost min-h-[44px] px-3 text-sm disabled:opacity-60"
          >
            {AI_FORM_LABELS.undo}
          </button>
        )}
      </div>
      <p className="text-sm text-ui-muted mb-3">{hint}</p>

      <label htmlFor="ai-form-instruction" className="sr-only">
        {title}
      </label>
      <textarea
        id="ai-form-instruction"
        rows={3}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void run()
          }
        }}
        placeholder={placeholder}
        disabled={form.busy}
        className="input"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* type="button": this sits inside the resident <form>, and the default
            submit type would post the form instead of asking the assistant. */}
        <button
          type="button"
          onClick={() => void run()}
          disabled={form.busy || instruction.trim() === ''}
          className="btn-primary min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {form.busy ? AI_FORM_LABELS.working : submit}
        </button>

        {form.changed.length > 0 && !form.busy && (
          <span className="text-sm text-ui-muted">
            {form.changed.length === 1
              ? AI_FORM_LABELS.changedOne
              : AI_FORM_LABELS.changedMany(form.changed.length)}
          </span>
        )}
      </div>

      {form.error && (
        <p role="alert" className="alert-error mt-3">
          {form.error}
        </p>
      )}
    </div>
  )
}
