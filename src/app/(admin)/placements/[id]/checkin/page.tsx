import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createCheckInFromForm } from '@/lib/actions'
import { CHECK_IN_TYPE_LABELS, CHECKIN_FORM_LABELS, UI_LABELS } from '@/lib/constants'
import { SubmitButton } from '@/components/ui'
import { weeksBetween } from '@/lib/utils'

export const metadata: Metadata = { title: 'Check-in' }

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewCheckInPage({ params }: Props) {
  const { id } = await params

  // Get placement with resident and housing info
  const placement = await prisma.placement.findUnique({
    where: { id },
    include: {
      resident: true,
      housingUnit: true,
      spot: true,
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!placement || placement.status !== 'ACTIVE') {
    notFound()
  }

  // Calculate weeks since placement
  const weeksSinceStart = weeksBetween(placement.startDate)

  // Determine suggested check-in type
  const checkInCount = placement.checkIns.length
  const suggestedType = checkInCount === 0 ? 'INITIAL' : 'REGULAR'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/residents/${placement.residentId}`}
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline"
        >
          {CHECKIN_FORM_LABELS.backLink(placement.resident.code)}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">
          {CHECKIN_FORM_LABELS.title}
        </h1>
        <p className="text-ui-muted">
          {placement.resident.code} in {placement.housingUnit.code}
          {placement.spot && ` (${placement.spot.label || placement.spot.code})`}
          {' • '}{CHECKIN_FORM_LABELS.week(weeksSinceStart)}
        </p>
      </div>

      {/* Previous Check-ins Summary */}
      {checkInCount > 0 && (
        <div className="card mb-6 bg-status-info/8">
          <h2 className="text-lg font-semibold text-ui-text mb-3">
            {CHECKIN_FORM_LABELS.previousTitle}
          </h2>
          <div className="space-y-2">
            {placement.checkIns.slice(0, 3).map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between text-sm">
                <span className="text-ui-muted">
                  {CHECK_IN_TYPE_LABELS[checkIn.checkInType] || checkIn.checkInType}
                  {' • '}{CHECKIN_FORM_LABELS.week(checkIn.weekNumber ?? 0)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {CHECKIN_FORM_LABELS.satisfactionScore(checkIn.overallSatisfaction)}
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      checkIn.overallSatisfaction >= 4
                        ? 'bg-status-success'
                        : checkIn.overallSatisfaction >= 3
                        ? 'bg-status-warning'
                        : 'bg-status-error'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Form */}
      <div className="card">
        <form action={createCheckInFromForm} className="space-y-6">
          <input type="hidden" name="placementId" value={placement.id} />

          {/* Check-in Type */}
          <div>
            <label className="label">{CHECKIN_FORM_LABELS.typeLabel}</label>
            <select
              name="checkInType"
              required
              className="input"
              defaultValue={suggestedType}
            >
              {Object.entries(CHECK_IN_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Main Satisfaction Score */}
          <div>
            <label className="label">{CHECKIN_FORM_LABELS.overallLabel}</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className="flex-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="overallSatisfaction"
                    value={score}
                    required
                    className="sr-only peer"
                  />
                  <div className="text-center p-3 rounded-lg border-2 border-ui-border peer-checked:border-brand-primary peer-checked:bg-brand-primary/10 hover:bg-ui-subtle transition-colors">
                    <div className="text-2xl mb-1">
                      {score === 1 ? '😢' : score === 2 ? '😕' : score === 3 ? '😐' : score === 4 ? '🙂' : '😊'}
                    </div>
                    <div className="text-sm font-medium">{score}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-ui-muted mt-1">
              {CHECKIN_FORM_LABELS.scaleHint}
            </p>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.roommatesLabel}</label>
              <select name="roommateRelations" className="input">
                <option value="">{CHECKIN_FORM_LABELS.notRated}</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {CHECKIN_FORM_LABELS.scaleGeneral[score]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.facilityLabel}</label>
              <select name="facilitySatisfaction" className="input">
                <option value="">{CHECKIN_FORM_LABELS.notRated}</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {CHECKIN_FORM_LABELS.scaleGeneral[score]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.safetyLabel}</label>
              <select name="safetyFeeling" className="input">
                <option value="">{CHECKIN_FORM_LABELS.notRated}</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {CHECKIN_FORM_LABELS.scaleSafety[score]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Feedback */}
          <div className="space-y-4">
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.concernsLabel}</label>
              <textarea
                name="concerns"
                rows={2}
                placeholder={CHECKIN_FORM_LABELS.concernsPlaceholder}
                className="input"
              />
            </div>
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.improvementsLabel}</label>
              <textarea
                name="improvements"
                rows={2}
                placeholder={CHECKIN_FORM_LABELS.improvementsPlaceholder}
                className="input"
              />
            </div>
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.positivesLabel}</label>
              <textarea
                name="positives"
                rows={2}
                placeholder={CHECKIN_FORM_LABELS.positivesPlaceholder}
                className="input"
              />
            </div>
          </div>

          {/* Staff Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{CHECKIN_FORM_LABELS.collectedByLabel}</label>
              <input
                type="text"
                name="collectedBy"
                placeholder={CHECKIN_FORM_LABELS.collectedByPlaceholder}
                className="input"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  value="true"
                  className="rounded border-ui-border-strong text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-ui-muted">
                  {CHECKIN_FORM_LABELS.anonymousLabel}
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 pb-safe sm:static sm:mx-0 sm:px-0 sm:py-0 bg-ui-surface/95 backdrop-blur border-t border-ui-border sm:border-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
            <Link
              href={`/residents/${placement.residentId}`}
              className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
            >
              {UI_LABELS.cancel}
            </Link>
            <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
              {CHECKIN_FORM_LABELS.submit}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
