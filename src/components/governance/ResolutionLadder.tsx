'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ResolutionStage } from '@prisma/client'
import { advanceResolutionStage } from '@/lib/actions/governance'
import {
  RESOLUTION_LADDER,
  RESOLUTION_OWNER_LABELS,
  RESOLUTION_STAGE_BY_KEY,
  RESOLUTION_STAGE_COLORS,
} from '@/lib/config/conflict-resolution'

interface ResolutionLadderProps {
  incidentId: string
  currentStage: ResolutionStage
  recommendation: {
    recommendedStage: ResolutionStage
    shouldEscalate: boolean
    isOverdue: boolean
    daysOverdue: number
    reason: string
  }
}

/**
 * Where this conflict stands, what should happen next, and why.
 *
 * The rungs are shown as a path rather than a status dropdown so it is visible
 * that escalation is a sequence with earlier, lighter steps — and that the
 * current position says nothing about who was at fault.
 */
export function ResolutionLadder({
  incidentId,
  currentStage,
  recommendation,
}: ResolutionLadderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentRung = RESOLUTION_STAGE_BY_KEY[currentStage].rung

  function moveTo(stage: ResolutionStage) {
    setError(null)
    startTransition(async () => {
      const result = await advanceResolutionStage({
        incidentId,
        stage,
        note: note || undefined,
      })
      if (result.success) {
        setNote('')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section className="card" aria-labelledby="ladder-heading">
      <h2 id="ladder-heading" className="mb-1 text-lg font-semibold text-ui-text">
        Konfliktbearbeitung
      </h2>
      <p className="mb-4 text-sm text-ui-muted">
        Jeder Schritt endet mit einer konkreten Abmachung und einem Datum, an dem überprüft wird, ob
        sie gehalten hat. Ein Schritt weiter heisst: die bisherige Lösung hat nicht getragen —
        nicht, dass jemand schuld ist.
      </p>

      <ol className="space-y-2">
        {RESOLUTION_LADDER.filter((def) => def.stage !== 'CLOSED').map((def) => {
          const isCurrent = def.stage === currentStage
          const isDone = def.rung < currentRung

          return (
            <li
              key={def.stage}
              className={`rounded-md border p-3 ${
                isCurrent ? 'border-brand-primary bg-brand-primary/5' : 'border-ui-border'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ui-text">
                  {isDone && <span aria-hidden="true">✓ </span>}
                  {def.label}
                  {isCurrent && (
                    <span className={`ml-2 badge ${RESOLUTION_STAGE_COLORS[def.stage]}`}>
                      Aktuell
                    </span>
                  )}
                </p>
                <span className="text-xs text-ui-muted">
                  {RESOLUTION_OWNER_LABELS[def.owner]} · {def.targetDays} Tage
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-ui-muted">{def.description}</p>
            </li>
          )
        })}
      </ol>

      <div
        className={`mt-4 rounded-md p-3 text-sm ${
          recommendation.shouldEscalate
            ? 'bg-status-warning/10 text-status-warning-text'
            : recommendation.isOverdue
              ? 'bg-status-info/10 text-status-info-text'
              : 'bg-ui-subtle text-ui-text'
        }`}
      >
        <p className="font-medium">Empfehlung</p>
        <p className="mt-1 leading-6">{recommendation.reason}</p>
      </div>

      {currentStage !== 'CLOSED' && (
        <div className="mt-4 border-t border-ui-border pt-4">
          <label htmlFor={`ladder-note-${incidentId}`} className="label">
            Notiz zum Schrittwechsel
          </label>
          <textarea
            id={`ladder-note-${incidentId}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="input w-full"
            placeholder="Was ist passiert? Wird im Verlauf festgehalten."
          />

          {error && (
            <p className="mt-2 text-sm text-status-error-text" role="alert">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {recommendation.shouldEscalate && (
              <button
                type="button"
                onClick={() => moveTo(recommendation.recommendedStage)}
                disabled={isPending}
                className="btn-primary min-h-[44px]"
              >
                Weiter zu «{RESOLUTION_STAGE_BY_KEY[recommendation.recommendedStage].label}»
              </button>
            )}
            <button
              type="button"
              onClick={() => moveTo('CLOSED')}
              disabled={isPending}
              className="btn-secondary min-h-[44px]"
            >
              Konflikt abschliessen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
