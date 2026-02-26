import type { Resident } from '@prisma/client'
import {
  SLEEP_SCHEDULE_LABELS,
  SOCIAL_STYLE_LABELS,
  SMOKING_STATUS_LABELS,
  MOBILITY_NEED_LABELS,
  LANGUAGE_LABELS,
  DIET_LABELS,
  RECYCLING_KNOWLEDGE_LABELS,
  ROOM_SHARING_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
  getLabel,
} from '@/lib/constants'
import { SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import { getEligibleSpotTypes } from '@/lib/config/placement-spots'
import { DetailRow } from '@/components/ui/Card'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

export interface ResidentProfileSidebarProps {
  resident: Pick<Resident,
    | 'hasMedicalDocumentation' | 'medicalDocType' | 'roomSharingStatus'
    | 'sleepSchedule' | 'noiseTolerance' | 'cleanlinessLevel' | 'socialStyle'
    | 'privacyNeed' | 'smokingStatus' | 'languages' | 'culturalRegion'
    | 'choresContribution' | 'recyclingKnowledge' | 'mobilityNeeds' | 'supportLevel'
    | 'hasNightDisturbances' | 'needsQuietEnvironment' | 'hasSleepEquipment'
    | 'medicalEquipment' | 'dietaryNeeds' | 'sharedBathroom' | 'sharedKitchen'
    | 'petTolerance' | 'notes'
  >
}

function PreferenceItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={value ? 'text-green-500' : 'text-gray-500'}>
        {value ? '\u2713' : '\u25CB'}
      </span>
      {label}
    </div>
  )
}

export function ResidentProfileSidebar({ resident }: ResidentProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* CRITICAL: Housing Authorization - Most important info at top */}
      <div className={`card border-2 ${resident.hasMedicalDocumentation ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {'\u{1F3E0}'} Unterkunftsberechtigung
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <dt className="text-gray-600">Ärztliche Dokumentation</dt>
            <dd className={`font-semibold ${resident.hasMedicalDocumentation ? 'text-blue-700' : 'text-gray-500'}`}>
              {resident.hasMedicalDocumentation ? '\u2713 Vorhanden' : '\u2717 Keine'}
            </dd>
          </div>
          {resident.hasMedicalDocumentation && resident.medicalDocType && (
            <div className="flex justify-between items-center">
              <dt className="text-gray-600">Berechtigung für</dt>
              <dd className="font-semibold text-blue-700">
                {getLabel(MEDICAL_DOC_TYPE_LABELS, resident.medicalDocType)}
              </dd>
            </div>
          )}
          <div className="flex justify-between items-center">
            <dt className="text-gray-600">Zimmerteilung</dt>
            <dd className="font-medium text-gray-900">
              {getLabel(ROOM_SHARING_STATUS_LABELS, resident.roomSharingStatus)}
            </dd>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <dt className="text-gray-500 text-xs mb-1">Erlaubte Platztypen</dt>
            <dd className="flex flex-wrap gap-1">
              {getEligibleSpotTypes(resident.hasMedicalDocumentation, resident.medicalDocType).map((type) => (
                <span
                  key={type}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    type === 'BED' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {SPOT_TYPE_ICONS[type as keyof typeof SPOT_TYPE_ICONS]} {type === 'BED' ? 'Bett' : type === 'PRIVATE_ROOM' ? 'Einzelzimmer' : 'Studio'}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      {/* Lifestyle & Daily Habits - Combined */}
      <CollapsibleSection title="Lebensstil">
        <dl className="space-y-2 text-sm">
          <DetailRow
            label="Schlafrhythmus"
            value={getLabel(SLEEP_SCHEDULE_LABELS, resident.sleepSchedule)}
          />
          <DetailRow
            label="Lärmtoleranz"
            value={`${resident.noiseTolerance}/5`}
          />
          <DetailRow
            label="Sauberkeit"
            value={`${resident.cleanlinessLevel}/5`}
          />
          <DetailRow
            label="Sozialstil"
            value={getLabel(SOCIAL_STYLE_LABELS, resident.socialStyle)}
          />
          <DetailRow
            label="Privatsphäre"
            value={`${resident.privacyNeed}/5`}
          />
          <DetailRow
            label="Rauchen"
            value={getLabel(SMOKING_STATUS_LABELS, resident.smokingStatus)}
          />
        </dl>
      </CollapsibleSection>

      {/* Languages & Background */}
      <CollapsibleSection title="Sprachen & Herkunft">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500 mb-2">Sprachen</dt>
            <dd className="flex flex-wrap gap-1">
              {resident.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-1 bg-aoz-accent text-aoz-secondary rounded text-xs font-medium"
                >
                  {getLabel(LANGUAGE_LABELS, lang)}
                </span>
              ))}
            </dd>
          </div>
          {resident.culturalRegion && (
            <DetailRow label="Region" value={resident.culturalRegion} />
          )}
        </dl>
      </CollapsibleSection>

      {/* Household & Independence */}
      <CollapsibleSection title="Haushalt & Selbständigkeit" defaultOpen={false}>
        <dl className="space-y-2 text-sm">
          <DetailRow
            label="Haushaltsbereitschaft"
            value={`${resident.choresContribution}/5`}
          />
          <DetailRow
            label="Recycling"
            value={getLabel(RECYCLING_KNOWLEDGE_LABELS, resident.recyclingKnowledge)}
          />
          <DetailRow
            label="Mobilität"
            value={getLabel(MOBILITY_NEED_LABELS, resident.mobilityNeeds)}
          />
          <DetailRow
            label="Betreuungsstufe"
            value={getLabel(SUPPORT_LEVEL_LABELS, resident.supportLevel)}
          />
        </dl>
      </CollapsibleSection>

      {/* Special Needs - Combined */}
      <CollapsibleSection title="Besondere Bedürfnisse" defaultOpen={false}>
        <div className="space-y-2 text-sm">
          <PreferenceItem
            label="Nächtliche Unruhe"
            value={resident.hasNightDisturbances}
          />
          <PreferenceItem
            label="Ruhige Umgebung nötig"
            value={resident.needsQuietEnvironment}
          />
          <PreferenceItem
            label="Schlafgeräte"
            value={resident.hasSleepEquipment}
          />
          <PreferenceItem
            label="Med. Geräte"
            value={resident.medicalEquipment}
          />
          {resident.dietaryNeeds.length > 0 && (
            <div className="pt-2">
              <dt className="text-gray-500 mb-1">Ernährung</dt>
              <dd className="flex flex-wrap gap-1">
                {resident.dietaryNeeds.map((diet) => (
                  <span
                    key={diet}
                    className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                  >
                    {getLabel(DIET_LABELS, diet)}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Sharing Preferences */}
      <CollapsibleSection title="Teilen & Präferenzen" defaultOpen={false}>
        <div className="space-y-2 text-sm">
          <PreferenceItem
            label="Geteiltes Bad"
            value={resident.sharedBathroom}
          />
          <PreferenceItem
            label="Geteilte Küche"
            value={resident.sharedKitchen}
          />
          <PreferenceItem
            label="Haustiere"
            value={resident.petTolerance}
          />
        </div>
      </CollapsibleSection>

      {/* Notes */}
      {resident.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notizen
          </h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {resident.notes}
          </p>
        </div>
      )}
    </div>
  )
}
