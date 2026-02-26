import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface HousingUnitData {
  address: string | null
  totalRooms: number | null
  quietHours: string | null
  smokingAllowed: boolean | null
  petsAllowed: boolean | null
}

interface PlacementData {
  startDate: Date
  compatibilityScore: number | null
}

interface PortalHousingCardProps {
  placement: PlacementData
  housingUnit: HousingUnitData | undefined
  roommatesCount: number
}

export function PortalHousingCard({ placement, housingUnit, roommatesCount }: PortalHousingCardProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.housing}</h2>
          <p className="text-gray-500">{housingUnit?.address}</p>
        </div>
        <span className="badge badge-active">{PORTAL_LABELS.dashboard.active}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <InfoBox
          label={PORTAL_LABELS.dashboard.moveIn}
          value={formatDate(placement.startDate)}
        />
        <InfoBox
          label={PORTAL_LABELS.dashboard.rooms}
          value={`${housingUnit?.totalRooms || 0}`}
        />
        <InfoBox
          label={PORTAL_LABELS.dashboard.roommates}
          value={`${roommatesCount}`}
        />
        <InfoBox
          label={PORTAL_LABELS.dashboard.compatibility}
          value={placement.compatibilityScore
            ? `${Math.round(placement.compatibilityScore)}%`
            : '--'}
        />
      </div>

      {/* House Rules Summary */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="font-medium text-gray-900 mb-2">{PORTAL_LABELS.dashboard.houseRules}</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          {housingUnit?.quietHours && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {PORTAL_LABELS.dashboard.quietHours}: {housingUnit.quietHours}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full ${
            housingUnit?.smokingAllowed
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {housingUnit?.smokingAllowed ? PORTAL_LABELS.dashboard.smokingAllowed : PORTAL_LABELS.dashboard.noSmoking}
          </span>
          <span className={`px-3 py-1 rounded-full ${
            housingUnit?.petsAllowed
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-50 text-gray-600'
          }`}>
            {housingUnit?.petsAllowed ? PORTAL_LABELS.dashboard.petsAllowed : PORTAL_LABELS.dashboard.noPets}
          </span>
        </div>
      </div>
    </div>
  )
}

interface PortalOnboardingCardProps {
  preferencesCompleted: boolean
}

export function PortalOnboardingCard({ preferencesCompleted }: PortalOnboardingCardProps) {
  const steps = PORTAL_LABELS.dashboard.onboarding.steps
  const stepDone = [true, preferencesCompleted, false, false]
  const activeStep = stepDone.indexOf(false)

  return (
    <div className="card mb-6 py-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {PORTAL_LABELS.dashboard.onboarding.title}
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        {PORTAL_LABELS.dashboard.onboarding.subtitle}
      </p>

      {/* Progress timeline */}
      <div className="space-y-4 mb-6">
        {steps.map((label, i) => {
          const done = stepDone[i]
          const isActive = i === activeStep

          return (
            <div key={label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done
                    ? 'bg-green-100 text-green-600'
                    : isActive
                      ? 'bg-aoz-primary/10 text-aoz-primary ring-2 ring-aoz-primary'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{i + 1}</span>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-6 mt-1 ${done ? 'bg-green-200' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pt-1">
                <p className={`text-sm font-medium ${
                  done ? 'text-green-700' : isActive ? 'text-aoz-primary' : 'text-gray-500'
                }`}>
                  {label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="bg-aoz-primary/5 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-3">
          {preferencesCompleted
            ? PORTAL_LABELS.dashboard.onboarding.browseHousingHint
            : PORTAL_LABELS.dashboard.onboarding.completePreferencesHint}
        </p>
        <Link
          href={preferencesCompleted ? '/portal/housing' : '/portal/preferences'}
          className="btn-primary inline-flex items-center min-h-[44px] px-6"
        >
          {preferencesCompleted
            ? PORTAL_LABELS.dashboard.onboarding.browseHousing
            : PORTAL_LABELS.dashboard.onboarding.completePreferences} →
        </Link>
      </div>

      {/* Contact info */}
      <p className="text-sm text-gray-500 mt-4">
        {PORTAL_LABELS.dashboard.noHousingContact}
      </p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}
