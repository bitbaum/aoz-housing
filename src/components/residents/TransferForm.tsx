'use client'

import { transferPlacement } from '@/lib/actions'
import { SubmitButton } from '@/components/ui'
import { SPOT_TYPE_LABELS, SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import { END_REASON_LABELS, END_REASON_DESCRIPTIONS, PLACEMENT_ACTIONS_LABELS, UI_LABELS } from '@/lib/constants'
import { TransferUnitSelector, type UnitCompatibilityData } from './TransferUnitSelector'
import type { UnitWithSpots } from '@/lib/types'

interface TransferFormProps {
  placementId: string
  residentId: string
  eligibleUnits: UnitWithSpots[]
  eligibleSpotTypes: string[]
  hasMedicalDocumentation: boolean
  unitCompatibility?: Record<string, UnitCompatibilityData>
  selectedUnitId: string
  onUnitSelect: (id: string) => void
  onClose: () => void
}

export function TransferForm({
  placementId,
  residentId,
  eligibleUnits,
  eligibleSpotTypes,
  hasMedicalDocumentation,
  unitCompatibility,
  selectedUnitId,
  onUnitSelect,
  onClose,
}: TransferFormProps) {
  const selectedUnit = eligibleUnits.find((u) => u.id === selectedUnitId)
  const spotsForSelectedUnit = selectedUnit
    ? selectedUnit.spots.filter((spot) => eligibleSpotTypes.includes(spot.type))
    : []

  const transferSummary = selectedUnit
    ? PLACEMENT_ACTIONS_LABELS.transferSummaryWithUnit(selectedUnit.code)
    : PLACEMENT_ACTIONS_LABELS.transferSummaryEmpty

  return (
    <form
      action={transferPlacement}
      className="mt-4 p-4 bg-status-info/8 rounded-lg space-y-4 border border-status-info/25"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-status-info-text">{PLACEMENT_ACTIONS_LABELS.transferTitle}</h4>
        <button
          type="button"
          className="text-status-info-text hover:text-status-info-text text-sm"
          onClick={onClose}
        >
          {PLACEMENT_ACTIONS_LABELS.closeBtn}
        </button>
      </div>
      <input type="hidden" name="currentPlacementId" value={placementId} />
      <input type="hidden" name="residentId" value={residentId} />

      {eligibleUnits.length === 0 && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/25 rounded text-sm text-status-warning-text">
          {PLACEMENT_ACTIONS_LABELS.noEligibleUnits}
        </div>
      )}

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.targetUnitLabel}</label>
        <TransferUnitSelector
          eligibleUnits={eligibleUnits}
          eligibleSpotTypes={eligibleSpotTypes}
          selectedUnitId={selectedUnitId}
          onUnitSelect={onUnitSelect}
          unitCompatibility={unitCompatibility}
        />
      </div>

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.targetSpotLabel}</label>
        <select
          name="targetSpotId"
          required
          className="input"
          disabled={!selectedUnitId}
        >
          <option value="">
            {selectedUnitId ? PLACEMENT_ACTIONS_LABELS.selectSpot : PLACEMENT_ACTIONS_LABELS.selectUnitFirst}
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
            ? PLACEMENT_ACTIONS_LABELS.medDocsSpotHint
            : PLACEMENT_ACTIONS_LABELS.noMedDocsSpotHint}
        </p>
      </div>

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.transferReasonLabel}</label>
        <select name="transferReason" required className="input">
          <option value="">{UI_LABELS.selectPlaceholder}</option>
          {Object.entries(END_REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key} title={END_REASON_DESCRIPTIONS[key]}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {PLACEMENT_ACTIONS_LABELS.transferReasonHint}
        </p>
      </div>

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.transferNotesLabel}</label>
        <textarea
          name="notes"
          rows={2}
          placeholder={PLACEMENT_ACTIONS_LABELS.transferNotesPlaceholder}
          className="input"
        />
      </div>

      <div className="p-3 bg-white border border-blue-200 rounded text-sm text-status-info-text">
        <strong>{PLACEMENT_ACTIONS_LABELS.summaryLabel}</strong> {transferSummary}
      </div>

      <SubmitButton
        pendingText={PLACEMENT_ACTIONS_LABELS.transferConfirmBtnPending}
        disabled={eligibleUnits.length === 0 || !selectedUnitId}
        className="btn-primary text-sm disabled:opacity-60 disabled:cursor-wait"
      >
        {PLACEMENT_ACTIONS_LABELS.transferConfirmBtn}
      </SubmitButton>
    </form>
  )
}
