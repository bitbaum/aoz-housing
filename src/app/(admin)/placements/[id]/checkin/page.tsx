import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createCheckInFromForm } from '@/lib/actions'
import { CHECK_IN_TYPE_LABELS } from '@/lib/constants'

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
  const weeksSinceStart = Math.floor(
    (Date.now() - new Date(placement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  // Determine suggested check-in type
  const checkInCount = placement.checkIns.length
  const suggestedType = checkInCount === 0 ? 'INITIAL' : 'REGULAR'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/residents/${placement.residentId}`}
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zu {placement.resident.code}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          Zufriedenheits-Check-in
        </h1>
        <p className="text-gray-500">
          {placement.resident.code} in {placement.housingUnit.code}
          {placement.spot && ` (${placement.spot.label || placement.spot.code})`}
          {' • '}Woche {weeksSinceStart}
        </p>
      </div>

      {/* Previous Check-ins Summary */}
      {checkInCount > 0 && (
        <div className="card mb-6 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Letzte Check-ins
          </h2>
          <div className="space-y-2">
            {placement.checkIns.slice(0, 3).map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {CHECK_IN_TYPE_LABELS[checkIn.checkInType] || checkIn.checkInType}
                  {' • '}Woche {checkIn.weekNumber}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Zufriedenheit: {checkIn.overallSatisfaction}/5
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      checkIn.overallSatisfaction >= 4
                        ? 'bg-green-500'
                        : checkIn.overallSatisfaction >= 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
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
            <label className="label">Art des Check-ins *</label>
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
            <label className="label">Allgemeine Zufriedenheit *</label>
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
                  <div className="text-center p-3 rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary/10 hover:bg-gray-50 transition-colors">
                    <div className="text-2xl mb-1">
                      {score === 1 ? '😢' : score === 2 ? '😕' : score === 3 ? '😐' : score === 4 ? '🙂' : '😊'}
                    </div>
                    <div className="text-sm font-medium">{score}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 = Sehr unzufrieden, 5 = Sehr zufrieden
            </p>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Beziehung zu Mitbewohnern</label>
              <select name="roommateRelations" className="input">
                <option value="">Nicht bewertet</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {score === 1 ? 'Sehr schlecht' : score === 2 ? 'Schlecht' : score === 3 ? 'OK' : score === 4 ? 'Gut' : 'Sehr gut'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Zufriedenheit mit Einrichtung</label>
              <select name="facilitySatisfaction" className="input">
                <option value="">Nicht bewertet</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {score === 1 ? 'Sehr schlecht' : score === 2 ? 'Schlecht' : score === 3 ? 'OK' : score === 4 ? 'Gut' : 'Sehr gut'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sicherheitsgefühl</label>
              <select name="safetyFeeling" className="input">
                <option value="">Nicht bewertet</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} - {score === 1 ? 'Sehr unsicher' : score === 2 ? 'Unsicher' : score === 3 ? 'OK' : score === 4 ? 'Sicher' : 'Sehr sicher'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Feedback */}
          <div className="space-y-4">
            <div>
              <label className="label">Anliegen / Sorgen</label>
              <textarea
                name="concerns"
                rows={2}
                placeholder="Was beschäftigt Sie? Gibt es Probleme?"
                className="input"
              />
            </div>
            <div>
              <label className="label">Verbesserungsvorschläge</label>
              <textarea
                name="improvements"
                rows={2}
                placeholder="Was könnte verbessert werden?"
                className="input"
              />
            </div>
            <div>
              <label className="label">Positives</label>
              <textarea
                name="positives"
                rows={2}
                placeholder="Was läuft gut? Was gefällt Ihnen?"
                className="input"
              />
            </div>
          </div>

          {/* Staff Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Erfasst von</label>
              <input
                type="text"
                name="collectedBy"
                placeholder="Name des Mitarbeiters"
                className="input"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  value="true"
                  className="rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-600">
                  Anonym erfassen
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
            <Link
              href={`/residents/${placement.residentId}`}
              className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
            >
              Abbrechen
            </Link>
            <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
              Check-in speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
