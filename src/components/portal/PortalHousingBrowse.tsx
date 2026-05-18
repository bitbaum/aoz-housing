import { PORTAL_LABELS } from '@/lib/constants'
import { getScoreLevel, SCORE_THRESHOLDS } from '@/lib/config/thresholds'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'

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

const L = PORTAL_LABELS.dashboard.housingBrowse

export function PortalHousingBrowse({ results }: PortalHousingBrowseProps) {
  if (results.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-ui-muted">{L.noMatches}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map(result => (
        <HousingCard key={result.unitId} result={result} />
      ))}

      <p className="text-sm text-ui-muted text-center pt-4">
        {L.contactHint}
      </p>
    </div>
  )
}

function HousingCard({ result }: { result: HousingResult }) {
  const level = getScoreLevel(result.fitScore)
  const badgeColor = SCORE_TOKENS[level].soft

  return (
    <div className="card">
      {/* Header: Address + Score */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-ui-text truncate">{result.address}</h3>
          <p className="text-sm text-ui-muted">
            {result.isEmpty
              ? L.emptyUnit
              : `${result.currentResidentCount} ${L.currentRoommates}`}
            {' · '}{result.availableSpots} {L.spots}
          </p>
        </div>
        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
          {Math.round(result.fitScore)}% {L.compatibility}
        </span>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-4">
        {result.features.sharedKitchen && <FeaturePill>{L.features.sharedKitchen}</FeaturePill>}
        {result.features.privateKitchen && <FeaturePill>{L.features.privateKitchen}</FeaturePill>}
        {result.features.smokingAllowed
          ? <FeaturePill>{L.features.smokingAllowed}</FeaturePill>
          : <FeaturePill>{L.features.noSmoking}</FeaturePill>}
        {result.features.petsAllowed && <FeaturePill>{L.features.petsAllowed}</FeaturePill>}
        {result.features.wheelchairAccess && <FeaturePill>{L.features.wheelchairAccess}</FeaturePill>}
        {result.features.groundFloor && <FeaturePill>{L.features.groundFloor}</FeaturePill>}
        {result.features.elevator && <FeaturePill>{L.features.elevator}</FeaturePill>}
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-ui-muted mb-1">{L.strengths}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.strengths.map(s => (
              <span key={s} className="px-2 py-0.5 bg-score-excellent/10 text-status-success-text rounded text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Concerns (non-blocking conflicts + warnings) */}
      {(result.concerns.length > 0 || result.conflicts.length > 0) && (
        <div>
          <p className="text-xs font-medium text-ui-muted mb-1">{L.concerns}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.conflicts.map(c => (
              <span key={c.message} className="px-2 py-0.5 bg-score-medium/10 text-status-warning-text rounded text-xs">
                {c.message}
              </span>
            ))}
            {result.concerns.map(c => (
              <span key={c} className="px-2 py-0.5 bg-score-medium/10 text-status-warning-text rounded text-xs">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 bg-ui-subtle text-ui-muted rounded text-xs">
      {children}
    </span>
  )
}
