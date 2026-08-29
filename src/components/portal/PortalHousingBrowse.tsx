'use client'

import { getScoreLevel } from '@/lib/config/thresholds'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'
import { useT } from '@/lib/i18n/LocaleProvider'
import { buildHousingBrowseLabels } from '@/lib/i18n/portal-surfaces'

interface HousingResult {
  unitId: string
  address: string
  availableSpots: number
  currentResidentCount: number
  fitScore: number
  strengths: string[]
  concerns: string[]
  conflicts: { severity: string; message: string }[]
  isEmpty: boolean
  features: {
    sharedKitchen: boolean
    privateKitchen: boolean
    smokingAllowed: boolean
    petsAllowed: boolean
    wheelchairAccess: boolean
    groundFloor: boolean
    elevator: boolean
  }
}

interface PortalHousingBrowseProps {
  results: HousingResult[]
}

export function PortalHousingBrowse({ results }: PortalHousingBrowseProps) {
  const t = useT()
  const L = buildHousingBrowseLabels(t)

  if (results.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-ui-muted">{L.noMatches}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <HousingCard key={result.unitId} result={result} L={L} />
      ))}

      <p className="text-sm text-ui-muted text-center pt-4">{L.contactHint}</p>
    </div>
  )
}

function HousingCard({
  result,
  L,
}: {
  result: HousingResult
  L: ReturnType<typeof buildHousingBrowseLabels>
}) {
  const level = getScoreLevel(result.fitScore)
  const badgeColor = SCORE_TOKENS[level].soft

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-ui-text truncate">{result.address}</h3>
          <p className="text-sm text-ui-muted">
            {result.isEmpty ? L.emptyUnit : `${result.currentResidentCount} ${L.currentRoommates}`}
            {' · '}
            {result.availableSpots} {L.spots}
          </p>
        </div>
        <span className={`flex-shrink-0 px-3 py-1 rounded-sm text-sm font-medium ${badgeColor}`}>
          {Math.round(result.fitScore)}% {L.compatibility}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {result.features.sharedKitchen && <FeaturePill>{L.features.sharedKitchen}</FeaturePill>}
        {result.features.privateKitchen && <FeaturePill>{L.features.privateKitchen}</FeaturePill>}
        {result.features.smokingAllowed ? (
          <FeaturePill>{L.features.smokingAllowed}</FeaturePill>
        ) : (
          <FeaturePill>{L.features.noSmoking}</FeaturePill>
        )}
        {result.features.petsAllowed && <FeaturePill>{L.features.petsAllowed}</FeaturePill>}
        {result.features.wheelchairAccess && (
          <FeaturePill>{L.features.wheelchairAccess}</FeaturePill>
        )}
        {result.features.groundFloor && <FeaturePill>{L.features.groundFloor}</FeaturePill>}
        {result.features.elevator && <FeaturePill>{L.features.elevator}</FeaturePill>}
      </div>

      {(result.strengths.length > 0 || result.concerns.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {result.strengths.length > 0 && (
            <div>
              <p className="eyebrow text-status-success-text">{L.strengths}</p>
              <ul className="mt-1 space-y-1 text-ui-muted">
                {result.strengths.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.concerns.length > 0 && (
            <div>
              <p className="eyebrow text-status-warning-text">{L.concerns}</p>
              <ul className="mt-1 space-y-1 text-ui-muted">
                {result.concerns.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-ui-subtle text-ui-muted border border-ui-border">
      {children}
    </span>
  )
}
