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
 * Decode the pre-labeled legacy format, which joined all parts with '. ' on a
 * single line and stored raw enum codes:
 *
 *   Altersgruppe: SIMILAR. Kultur: SAME_REGION. free text
 *
 * Returns null when the line doesn't lead with a recognizable legacy segment.
 */
function parseLegacyLine(line: string): RoommatePreferenceParts | null {
  const parts: RoommatePreferenceParts = {
    preferredAgeRange: '',
    culturalPreference: '',
    additionalPreferences: '',
  }
  let rest = line

  const ageMatch = rest.match(/^Altersgruppe: ([A-Z_]+)(?:\.\s+|\.?$)/)
  if (ageMatch) {
    const value = resolveValue(ageMatch[1], AGE_LABEL_TO_VALUE, AGE_VALUE_TO_LABEL)
    if (value) {
      parts.preferredAgeRange = value
      rest = rest.slice(ageMatch[0].length)
    }
  }

  const cultureMatch = rest.match(/^Kultur: ([A-Z_]+)(?:\.\s+|\.?$)/)
  if (cultureMatch) {
    const value = resolveValue(cultureMatch[1], CULTURE_LABEL_TO_VALUE, CULTURE_VALUE_TO_LABEL)
    if (value) {
      parts.culturalPreference = value
      rest = rest.slice(cultureMatch[0].length)
    }
  }

  if (!parts.preferredAgeRange && !parts.culturalPreference) return null

  parts.additionalPreferences = rest.trim()
  return parts
}

/**
 * Parse the stored string back into the three form inputs.
 * Unrecognized lines (legacy free-form values, unknown labels) are preserved
 * in `additionalPreferences` rather than dropped. Once a line has been
 * attributed to the free-text wishes, every following line is treated as its
 * continuation — so wishes that happen to start with "Kultur: " etc. are
 * never mis-promoted into a structured field.
 */
export function parseRoommatePreferences(text: string | null | undefined): RoommatePreferenceParts {
  const result: RoommatePreferenceParts = {
    preferredAgeRange: '',
    culturalPreference: '',
    additionalPreferences: '',
  }
  if (!text) return result

  const additionalLines: string[] = []
  let inFreeText = false

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '')

    if (!inFreeText) {
      if (!result.preferredAgeRange && line.startsWith(AGE_PREFIX)) {
        const value = resolveValue(line.slice(AGE_PREFIX.length).trim(), AGE_LABEL_TO_VALUE, AGE_VALUE_TO_LABEL)
        if (value) {
          result.preferredAgeRange = value
          continue
        }
        // Not a clean label/code — may be the legacy '. '-joined single line.
        const legacy = parseLegacyLine(line)
        if (legacy) {
          result.preferredAgeRange = result.preferredAgeRange || legacy.preferredAgeRange
          result.culturalPreference = result.culturalPreference || legacy.culturalPreference
          if (legacy.additionalPreferences) {
            additionalLines.push(legacy.additionalPreferences)
            inFreeText = true
          }
          continue
        }
      }

      if (!result.culturalPreference && line.startsWith(CULTURE_PREFIX)) {
        const value = resolveValue(line.slice(CULTURE_PREFIX.length).trim(), CULTURE_LABEL_TO_VALUE, CULTURE_VALUE_TO_LABEL)
        if (value) {
          result.culturalPreference = value
          continue
        }
        const legacy = parseLegacyLine(line)
        if (legacy) {
          result.culturalPreference = result.culturalPreference || legacy.culturalPreference
          if (legacy.additionalPreferences) {
            additionalLines.push(legacy.additionalPreferences)
            inFreeText = true
          }
          continue
        }
      }
    }

    if (line.startsWith(ADDITIONAL_PREFIX) && !inFreeText) {
      additionalLines.push(line.slice(ADDITIONAL_PREFIX.length))
      inFreeText = true
      continue
    }

    additionalLines.push(line)
    if (line.trim()) inFreeText = true
  }

  result.additionalPreferences = additionalLines.join('\n').trim()
  return result
}
