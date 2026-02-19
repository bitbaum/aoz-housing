'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  TASK_TYPE_LABELS,
  TASK_TYPE_DESCRIPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_TEMPLATES,
  CHORE_LABELS,
  type TaskTemplate,
} from '@/lib/config/household-tasks'

export function CreateChoreForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from template
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('CLEANING')
  const [taskType, setTaskType] = useState('RECURRING_AS_NEEDED')
  const [instructions, setInstructions] = useState('')
  const [scheduleHuman, setScheduleHuman] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')

  function applyTemplate(template: TaskTemplate) {
    setTitle(template.title)
    setCategory(template.category)
    setTaskType(template.taskType)
    setInstructions(template.instructions || '')
    setScheduleHuman(template.scheduleHuman || '')
    setEstimatedMinutes(template.estimatedMinutes?.toString() || '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/portal/chores', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        router.push('/portal/chores')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || CHORE_LABELS.errors.generic)
      }
    } catch {
      setError(CHORE_LABELS.errors.generic)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Template picker */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">{CHORE_LABELS.actions.useTemplate}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.title}
              type="button"
              onClick={() => applyTemplate(template)}
              className="min-h-[44px] p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
            >
              <span className="text-lg">{TASK_CATEGORY_ICONS[template.category]}</span>
              <p className="text-sm font-medium text-gray-900 mt-1">{template.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm" role="alert" aria-live="polite">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.title} *
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={CHORE_LABELS.form.titlePlaceholder}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.category}
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm min-h-[44px]"
          >
            {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {TASK_CATEGORY_ICONS[key]} {label}
              </option>
            ))}
          </select>
        </div>

        {/* Task type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {CHORE_LABELS.form.taskType}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTaskType(key)}
                className={`min-h-[44px] p-3 rounded-lg text-left text-sm transition-colors ${
                  taskType === key
                    ? 'bg-aoz-primary/10 text-aoz-primary border-2 border-aoz-primary'
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <p className="font-medium">{label}</p>
                <p className="text-xs mt-0.5 opacity-75">{TASK_TYPE_DESCRIPTIONS[key]}</p>
              </button>
            ))}
          </div>
          <input type="hidden" name="taskType" value={taskType} />
        </div>

        {/* Schedule (for recurring) */}
        {taskType.startsWith('RECURRING') && (
          <div>
            <label htmlFor="scheduleHuman" className="block text-sm font-medium text-gray-700 mb-1">
              {CHORE_LABELS.form.schedule}
            </label>
            <input
              id="scheduleHuman"
              name="scheduleHuman"
              value={scheduleHuman}
              onChange={e => setScheduleHuman(e.target.value)}
              placeholder={CHORE_LABELS.form.schedulePlaceholder}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />
          </div>
        )}

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.priority}
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="NORMAL"
            className="w-full rounded-lg border border-gray-300 p-3 text-sm min-h-[44px]"
          >
            {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Estimated minutes */}
        <div>
          <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.estimatedMinutes}
          </label>
          <input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min="1"
            max="480"
            value={estimatedMinutes}
            onChange={e => setEstimatedMinutes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.description}
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder={CHORE_LABELS.form.descriptionPlaceholder}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
            {CHORE_LABELS.form.instructions}
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows={2}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={CHORE_LABELS.form.instructionsPlaceholder}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full min-h-[44px]"
        >
          {submitting ? CHORE_LABELS.form.submitting : CHORE_LABELS.form.submit}
        </button>
      </form>
    </div>
  )
}
