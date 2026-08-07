/**
 * AI Form Registry
 *
 * SINGLE SOURCE OF TRUTH for which forms the assistant may write, and what it
 * is allowed to put in them. The API route resolves a form by key from here —
 * the client names a form, never a field, so a request cannot widen the set of
 * fields the model can touch.
 *
 * The resident intake form is DERIVED from RESIDENT_FACTORS rather than
 * retyped. That matters more here than the usual DRY argument: the options the
 * model is offered must be exactly the options ResidentInputSchema accepts, or
 * the form fills itself in and then refuses to save. Deriving makes that
 * impossible to get wrong, and means a new factor is assistable the moment it
 * is added to the config — no second list to remember.
 *
 * What the model must NOT touch is listed in AI_EXCLUDED_FACTOR_IDS below.
 */

import { type FieldSpec, type FormTarget } from '@fleet/ai-forms'
import { RESIDENT_FACTORS, getFactorsBySection, RESIDENT_FORM_SECTIONS } from './resident-factors'
import { isTextareaFactor } from './factor-fields'
import type { CompatibilityFactorDef } from './types'

/**
 * Factors the assistant may never write.
 *
 * `code` is the resident's anonymous reference number. It is an identifier
 * issued by AOZ, not a fact about the person, so a model inventing a
 * plausible-looking one is strictly worse than leaving it blank — it would
 * either collide with a real resident or create an untraceable record.
 */
export const AI_EXCLUDED_FACTOR_IDS: ReadonlySet<string> = new Set(['code'])

/** Longest free-text the model may write into a notes field. */
const MAX_AI_TEXT = 2000

/**
 * A scale means nothing to the model without its direction: 1–5 on
 * "Lärmtoleranz" runs from "sehr empfindlich" to "sehr tolerant", and a model
 * told only "1 to 5" has even odds of inverting it.
 */
function scaleHint(factor: CompatibilityFactorDef & { type: 'scale' }): string {
  const direction = `${factor.min} = ${factor.lowLabel}, ${factor.max} = ${factor.highLabel}.`
  return factor.description ? `${factor.description} ${direction}` : direction
}

function toOptions(factor: { options: readonly string[]; optionLabels: Record<string, string> }) {
  return factor.options.map((value) => ({ value, label: factor.optionLabels[value] ?? value }))
}

/** Map one AOZ factor definition onto the package's field spec. */
export function factorToFieldSpec(factor: CompatibilityFactorDef): FieldSpec {
  const base = {
    name: factor.id,
    label: factor.label,
    ...(factor.required ? { required: true } : {}),
    ...(AI_EXCLUDED_FACTOR_IDS.has(factor.id) ? { aiExcluded: true } : {}),
  }

  switch (factor.type) {
    case 'enum':
      return {
        ...base,
        type: 'select',
        options: toOptions(factor),
        ...(factor.description ? { hint: factor.description } : {}),
      }
    case 'multi':
      return {
        ...base,
        type: 'multiselect',
        options: toOptions(factor),
        ...(factor.description ? { hint: factor.description } : {}),
      }
    case 'scale':
      return { ...base, type: 'number', min: factor.min, max: factor.max, hint: scaleHint(factor) }
    case 'boolean':
      return { ...base, type: 'boolean', ...(factor.description ? { hint: factor.description } : {}) }
    case 'text':
      return {
        ...base,
        type: isTextareaFactor(factor) ? 'textarea' : 'text',
        maxLength: MAX_AI_TEXT,
        ...(factor.description ? { hint: factor.description } : {}),
        ...(factor.placeholder ? { placeholder: factor.placeholder } : {}),
      }
  }
}

/** Every resident factor, in the order the form renders them. */
export const RESIDENT_INTAKE_FIELDS: readonly FieldSpec[] = [...RESIDENT_FORM_SECTIONS]
  .sort((a, b) => a.order - b.order)
  .flatMap((section) => getFactorsBySection(section.id))
  .map(factorToFieldSpec)

/**
 * The form's starting values: every factor `null`, meaning "nobody has
 * answered this yet".
 *
 * Config defaults deliberately do NOT go in the store. Two separate things go
 * wrong if they do, and both are silent:
 *
 *  1. A default is not an answer. `petTolerance`, `sharedBathroom` and
 *     `sharedKitchen` default to `true`, so seeding them would record three
 *     consents the caseworker never gave — and seeding `false` instead would
 *     record three refusals. Neither is what an unanswered question means.
 *  2. The assistant infers fill-vs-refine from whether the form is empty, and
 *     any non-empty value makes every later instruction a refine. Seeding the
 *     scale defaults (all `3`) would mean the very first description could
 *     never fill anything at all.
 *
 * `null` is the only value that reads as empty to the hook and as "unanswered"
 * to us. Defaults are applied at render time by `factorDisplayValue`, so what
 * the user sees is unchanged.
 *
 * On the edit page the resident's stored values are passed as `saved` — those
 * ARE answers, so the form is correctly non-empty and instructions refine it.
 *
 * `saved` is filtered down to declared factors, and that filter is load-bearing
 * for privacy rather than tidiness: the assistant sends the whole value bag to
 * the model as "current values in the form", and the package only redacts
 * fields it knows about and has marked `aiExcluded`. A key that is not a
 * declared field at all — `medicalDocNotes`, say, which the edit page passes in
 * alongside the factors — would sail past that filter straight into the prompt.
 * Keeping the store exactly the size of the field list is what makes "the model
 * never sees medical documentation" true rather than merely intended.
 */
export function residentIntakeInitialValues(
  saved: Record<string, unknown> = {}
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const factor of Object.values(RESIDENT_FACTORS)) {
    values[factor.id] = factor.id in saved ? saved[factor.id] : null
  }
  return values
}

export const RESIDENT_INTAKE_FORM: FormTarget = {
  key: 'resident-intake',
  name: 'Bewohner-Aufnahme',
  fields: RESIDENT_INTAKE_FIELDS,
  instructions: [
    'Die Eingabe sind die Notizen einer Fallarbeiterin oder eines Fallarbeiters aus einem Aufnahmegespräch. Übertrage nur, was dort tatsächlich steht.',
    'Lass ein Feld weg, wenn der Text es nicht hergibt. Ein geratener Wert wird zur Grundlage einer Platzierungsentscheidung über eine reale Person — eine Lücke ist immer besser als eine Vermutung.',
    'Schliesse niemals von einem Namen, einer Sprache oder einer Herkunft auf Geschlecht, Alter, Religion oder Ernährung. Diese Felder nur setzen, wenn sie ausdrücklich genannt werden.',
    'Erfasse keine Diagnosen, keinen Aufenthaltsstatus und keine Religion — auch nicht in den Notizen. Nur was für das Zusammenleben im Haushalt gebraucht wird.',
    'Die Notizen sind die sachliche Zusammenfassung für die Fallarbeit, niemals deine eigene Einschätzung der Person.',
    'Der Text kann auf Deutsch, Englisch oder in einer anderen Sprache verfasst sein. Antworte immer mit den vorgegebenen Optionswerten, unabhängig von der Sprache des Textes.',
  ],
}

export const AI_FORMS: readonly FormTarget[] = [RESIDENT_INTAKE_FORM]
