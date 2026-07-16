/**
 * Serialization helpers for the `resident.roommatePreferences` column.
 *
 * The portal preferences form captures three separate inputs (preferred age
 * range, cultural preference, free-text wishes) that are stored in a single
 * string column. Staff read this column directly, so the serialized format
 * uses human-readable German labels — one labeled line per part:
 *
 *   Altersgruppe: Ähnliches Alter wie ich
 *   Kultur: Aus meiner Region
 *   Wünsche: Ich arbeite Nachtschicht
 *
 * `parseRoommatePreferences` reverses the format so the form can re-populate
 * its fields. Legacy or free-form content that cannot be attributed to a
 * structured field is preserved in `additionalPreferences` instead of being
 * dropped.
 */

import { PORTAL_LABELS } from '@/lib/constants/labels/portal'
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'
import type { EnumFactorDef } from '@/lib/config/types'

const FIELD_LABELS = PORTAL_LABELS.preferences.fields

const AGE_PREFIX = 'Altersgruppe: '
const CULTURE_PREFIX = 'Kultur: '
const ADDITIONAL_PREFIX = 'Wünsche: '

const ageRangeFactor = RESIDENT_FACTORS.ageRange as EnumFactorDef

/** Form value → human-readable German label */
const AGE_VALUE_TO_LABEL: Record<string, string> = {
  SIMILAR: FIELD_LABELS.similarAge,
  ...Object.fromEntries(
    ageRangeFactor.options.map((opt) => [opt, ageRangeFactor.optionLabels[opt]])
  ),
}

const CULTURE_VALUE_TO_LABEL: Record<string, string> = {
  SAME_REGION: FIELD_LABELS.sameRegion,
  DIFFERENT_REGION: FIELD_LABELS.differentRegion,
}

function invert(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([value, label]) => [label, value]))
}

const AGE_LABEL_TO_VALUE = invert(AGE_VALUE_TO_LABEL)
const CULTURE_LABEL_TO_VALUE = invert(CULTURE_VALUE_TO_LABEL)

export interface RoommatePreferenceParts {
  /** Form value, e.g. 'SIMILAR' or 'YOUNG_ADULT' — empty string if unset */
  preferredAgeRange: string
  /** Form value, e.g. 'SAME_REGION' — empty string if unset */
  culturalPreference: string
  /** Free-text wishes (also collects unparseable legacy content) */
  additionalPreferences: string
}

export interface RoommatePreferenceInput {
  preferredAgeRange?: string | null
  culturalPreference?: string | null
  additionalPreferences?: string | null
}

/**
 * Serialize the three form inputs into the stored string.
 * Known form values are written as their German labels; unknown values are
 * written verbatim so nothing is lost. Returns null when all parts are empty.
 */
export function serializeRoommatePreferences(input: RoommatePreferenceInput): string | null {
  const lines: string[] = []

  const age = input.preferredAgeRange?.trim()
  if (age) lines.push(`${AGE_PREFIX}${AGE_VALUE_TO_LABEL[age] ?? age}`)

  const culture = input.culturalPreference?.trim()
  if (culture) lines.push(`${CULTURE_PREFIX}${CULTURE_VALUE_TO_LABEL[culture] ?? culture}`)

  const additional = input.additionalPreferences?.trim()
  if (additional) lines.push(`${ADDITIONAL_PREFIX}${additional}`)

  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * Resolve a serialized value back to a form value.
 * Accepts the German label (current format) or a raw form value code
 * (legacy format stored codes verbatim). Returns null when unrecognized.
 */
function resolveValue(
  raw: string,
  labelToValue: Record<string, string>,
  valueToLabel: Record<string, string>
): string | null {
  if (labelToValue[raw]) return labelToValue[raw]
  if (raw in valueToLabel) return raw
  return null
}

/**
 * Parse the stored string back into the three form inputs.
 * Unrecognized lines (legacy free-form values, unknown labels) are preserved
 * in `additionalPreferences` rather than dropped.
 */
export function parseRoommatePreferences(text: string | null | undefined): RoommatePreferenceParts {
  const result: RoommatePreferenceParts = {
    preferredAgeRange: '',
    culturalPreference: '',
    additionalPreferences: '',
  }
  if (!text) return result

  const additionalLines: string[] = []

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '')

    if (!result.preferredAgeRange && line.startsWith(AGE_PREFIX)) {
      const value = resolveValue(line.slice(AGE_PREFIX.length).trim(), AGE_LABEL_TO_VALUE, AGE_VALUE_TO_LABEL)
      if (value) {
        result.preferredAgeRange = value
        continue
      }
    }

    if (!result.culturalPreference && line.startsWith(CULTURE_PREFIX)) {
      const value = resolveValue(line.slice(CULTURE_PREFIX.length).trim(), CULTURE_LABEL_TO_VALUE, CULTURE_VALUE_TO_LABEL)
      if (value) {
        result.culturalPreference = value
        continue
      }
    }

    if (line.startsWith(ADDITIONAL_PREFIX)) {
      additionalLines.push(line.slice(ADDITIONAL_PREFIX.length))
      continue
    }

    additionalLines.push(line)
  }

  result.additionalPreferences = additionalLines.join('\n').trim()
  return result
}
