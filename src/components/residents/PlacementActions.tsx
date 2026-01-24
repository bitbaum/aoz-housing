'use client'

import { useState } from 'react'
import Link from 'next/link'
import { endPlacement, transferPlacement } from '@/lib/actions'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
} from '@/lib/config/placement-spots'
import { END_REASON_LABELS, END_REASON_DESCRIPTIONS } from '@/lib/constants'

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

interface PlacementActionsProps {
  placementId: string
  residentId: string
  currentUnitId: string
  hasMedicalDocumentation: boolean
  availableUnits: Unit[]
  eligibleSpotTypes: string[]
}

export function PlacementActions({
  placementId,
  residentId,
  currentUnitId,
  hasMedicalDocumentation,
  availableUnits,
  eligibleSpotTypes,
}: PlacementActionsProps) {
  const [showTransfer, setShowTransfer] = useState(false)
  const [showEnd, setShowEnd] = useState(false)

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
            <select name="targetHousingUnitId" required className="input">
              <option value="">Bitte wählen</option>
              {availableUnits
                .filter((u) => u.id !== currentUnitId && u.spots.length > 0)
                .map((unit) => {
                  const eligibleSpots = unit.spots.filter((spot) =>
                    eligibleSpotTypes.includes(spot.type)
                  )
                  if (eligibleSpots.length === 0) return null
                  return (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} - {unit.address} ({eligibleSpots.length} Plätze
                      frei)
                    </option>
                  )
                })}
            </select>
          </div>

          <div>
            <label className="label">Ziel-Platz *</label>
            <select name="targetSpotId" required className="input">
              <option value="">Bitte wählen</option>
              {availableUnits
                .filter((u) => u.id !== currentUnitId)
                .flatMap((unit) =>
                  unit.spots
                    .filter((spot) => eligibleSpotTypes.includes(spot.type))
                    .map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {unit.code} →{' '}
                        {
                          SPOT_TYPE_ICONS[
                            spot.type as keyof typeof SPOT_TYPE_ICONS
                          ]
                        }{' '}
                        {spot.label || spot.code} (
                        {
                          SPOT_TYPE_LABELS[
                            spot.type as keyof typeof SPOT_TYPE_LABELS
                          ]
                        }
                        )
                      </option>
                    ))
                )}
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
