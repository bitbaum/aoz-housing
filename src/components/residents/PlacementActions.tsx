'use client'

import { useState } from 'react'
import Link from 'next/link'
import { endPlacement, transferPlacement } from '@/lib/actions'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
} from '@/lib/config/placement-spots'
import { END_REASON_LABELS, END_REASON_DESCRIPTIONS, COMPATIBILITY_GAP_LABELS } from '@/lib/constants'
import { TransferUnitSelector, type UnitCompatibilityData } from './TransferRecommendations'

interface Spot {
  id: string
  code: string
  type: string
  label: string | null
}

interface Unit {
  id: string
  code: string
  address: string
  spots: Spot[]
}

interface RecentIncident {
  id: string
  date: Date
  type: string
  description: string
}

interface PlacementActionsProps {
  placementId: string
  residentId: string
  currentUnitId: string
  hasMedicalDocumentation: boolean
  availableUnits: Unit[]
  eligibleSpotTypes: string[]
  /** Full compatibility data per unit (enables algorithm-powered transfer recommendations) */
  unitCompatibility?: Record<string, UnitCompatibilityData>
  /** Recent incidents for linking to conflict end reason */
  recentIncidents?: RecentIncident[]
  /** Initial compatibility score at placement time (for predictability question) */
  initialCompatibilityScore?: number | null
}

export function PlacementActions({
  placementId,
  residentId,
  currentUnitId,
  hasMedicalDocumentation,
  availableUnits,
  eligibleSpotTypes,
  unitCompatibility,
  recentIncidents = [],
  initialCompatibilityScore,
}: PlacementActionsProps) {
  const [showTransfer, setShowTransfer] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedEndReason, setSelectedEndReason] = useState<string>('')

  // Get eligible units (different from current, has eligible spots)
  const eligibleUnits = availableUnits.filter((u) => {
    if (u.id === currentUnitId) return false
    const eligibleSpots = u.spots.filter((spot) =>
      eligibleSpotTypes.includes(spot.type)
    )
    return eligibleSpots.length > 0
  })

  // Get spots for currently selected unit only
  const selectedUnit = eligibleUnits.find((u) => u.id === selectedUnitId)
  const spotsForSelectedUnit = selectedUnit
    ? selectedUnit.spots.filter((spot) => eligibleSpotTypes.includes(spot.type))
    : []

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Aktionen</h3>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/placements/${placementId}/checkin`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <span>📋</span>
          Check-in durchführen
        </Link>
        <button
          type="button"
          className={`btn-outline inline-flex items-center gap-2 ${
            showTransfer ? 'ring-2 ring-blue-300 bg-blue-50' : ''
          }`}
          onClick={() => {
            setShowTransfer(!showTransfer)
            setShowEnd(false)
          }}
        >
          <span>🔄</span>
          Verlegen
        </button>
        <button
          type="button"
          className={`btn-outline inline-flex items-center gap-2 ${
            showEnd
              ? 'ring-2 ring-red-300 bg-red-50 text-red-600'
              : 'text-gray-500 hover:text-red-600 hover:border-red-300'
          }`}
          onClick={() => {
            setShowEnd(!showEnd)
            setShowTransfer(false)
          }}
        >
          <span>⏹️</span>
          Beenden
        </button>
      </div>

      {/* Transfer Placement Form */}
      {showTransfer && (
        <form
          action={transferPlacement}
          className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Bewohner verlegen</h4>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={() => setShowTransfer(false)}
            >
              ✕ Schliessen
            </button>
          </div>
          <input type="hidden" name="currentPlacementId" value={placementId} />
          <input type="hidden" name="residentId" value={residentId} />

          <div>
            <label className="label">Ziel-Unterkunft *</label>
            <TransferUnitSelector
              eligibleUnits={eligibleUnits}
              eligibleSpotTypes={eligibleSpotTypes}
              selectedUnitId={selectedUnitId}
              onUnitSelect={setSelectedUnitId}
              unitCompatibility={unitCompatibility}
            />
          </div>

          <div>
            <label className="label">Ziel-Platz *</label>
            <select
              name="targetSpotId"
              required
              className="input"
              disabled={!selectedUnitId}
            >
              <option value="">
                {selectedUnitId ? 'Platz auswählen' : 'Zuerst Unterkunft wählen'}
              </option>
              {spotsForSelectedUnit.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                  {spot.label || spot.code} (
                  {SPOT_TYPE_LABELS[spot.type as keyof typeof SPOT_TYPE_LABELS]})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {hasMedicalDocumentation
                ? 'Zeigt Plätze passend zur med. Dokumentation'
                : 'Zeigt nur Betten (keine med. Dokumentation)'}
            </p>
          </div>

          <div>
            <label className="label">Grund für Verlegung *</label>
            <select name="transferReason" required className="input">
              <option value="">Bitte wählen</option>
              {Object.entries(END_REASON_LABELS).map(([key, label]) => (
                <option
                  key={key}
                  value={key}
                  title={END_REASON_DESCRIPTIONS[key]}
                >
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Wählen Sie den Hauptgrund für die Verlegung
            </p>
          </div>

          <div>
            <label className="label">Notizen</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Optionale Anmerkungen zur Verlegung..."
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary text-sm">
            Verlegen bestätigen
          </button>
        </form>
      )}

      {/* End Placement Form */}
      {showEnd && (
        <form
          action={endPlacement}
          className="mt-4 p-4 bg-red-50 rounded-lg space-y-4 border border-red-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-red-900">Platzierung beenden</h4>
            <button
              type="button"
              className="text-red-600 hover:text-red-800 text-sm"
              onClick={() => setShowEnd(false)}
            >
              ✕ Schliessen
            </button>
          </div>
          <input type="hidden" name="placementId" value={placementId} />
          <input type="hidden" name="residentId" value={residentId} />

          <div className="p-3 bg-red-100 rounded text-sm text-red-800">
            <strong>Achtung:</strong> Diese Aktion beendet die aktuelle
            Platzierung. Der Bewohner wird als nicht platziert markiert.
          </div>

          <div>
            <label className="label">Grund *</label>
            <div className="space-y-2">
              {Object.entries(END_REASON_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 p-2 rounded hover:bg-red-100 cursor-pointer">
                  <input
                    type="radio"
                    name="endReason"
                    value={key}
                    required
                    className="mt-1"
                    onChange={() => setSelectedEndReason(key)}
                  />
                  <div>
                    <span className="font-medium text-gray-900">{label}</span>
                    <p className="text-xs text-gray-500">
                      {END_REASON_DESCRIPTIONS[key]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conflict Analysis Fields - shown only when CONFLICT is selected */}
          {selectedEndReason === 'CONFLICT' && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600 text-lg">📊</span>
                <h5 className="font-medium text-orange-900">Konfliktanalyse</h5>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Diese Angaben helfen, das Matching zu verbessern und zukünftige Konflikte zu vermeiden.
              </p>

              <div>
                <label className="label">Hauptursache des Konflikts *</label>
                <select name="conflictGap" required className="input">
                  <option value="">Bitte wählen</option>
                  {Object.entries(COMPATIBILITY_GAP_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">War der Konflikt vorhersehbar?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wasPredictable"
                      value="true"
                      className="accent-orange-600"
                    />
                    <span className="text-sm text-gray-700">
                      Ja
                      {initialCompatibilityScore !== null && initialCompatibilityScore !== undefined && initialCompatibilityScore < 60 && (
                        <span className="text-orange-600 ml-1">(Score war {Math.round(initialCompatibilityScore)}%)</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wasPredictable"
                      value="false"
                      className="accent-orange-600"
                    />
                    <span className="text-sm text-gray-700">Nein</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hätte der Algorithmus diesen Konflikt vorhersagen können?
                </p>
              </div>

              {recentIncidents.length > 0 && (
                <div>
                  <label className="label">Verknüpfter Vorfall</label>
                  <select name="relatedIncidentId" className="input">
                    <option value="">Keinen Vorfall verknüpfen</option>
                    {recentIncidents.map((incident) => (
                      <option key={incident.id} value={incident.id}>
                        {new Date(incident.date).toLocaleDateString('de-CH')} - {incident.type}: {incident.description.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Vorfall der zu dieser Beendigung geführt hat
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Notizen</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Optionale Anmerkungen..."
              className="input"
            />
          </div>

          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            Platzierung endgültig beenden
          </button>
        </form>
      )}
    </div>
  )
}
