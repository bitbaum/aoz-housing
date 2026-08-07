/**
 * Presentation rules shared by everything that renders a factor.
 *
 * Separate from ai-forms.ts on purpose: these are pure functions over a
 * FactorDef with no dependency on the AI package, so the form components (and
 * their tests) do not pull it in.
 */

import type { FactorDef } from './types'

/**
 * Text factors rendered as a multi-line box rather than a single-line input.
 *
 * Lives in config so the renderer and the AI field registry agree — this used
 * to be an `id === 'notes'` check inside the input component, where nothing
 * else could see it.
 */
export const TEXTAREA_FACTOR_IDS: ReadonlySet<string> = new Set(['notes', 'concerns'])

export function isTextareaFactor(factor: Pick<FactorDef, 'id' | 'type'>): boolean {
  return factor.type === 'text' && TEXTAREA_FACTOR_IDS.has(factor.id)
}

/**
 * What to render for a factor: the stored answer, or the config default while
 * the question is still unanswered.
 *
 * Keeping defaults out of the stored values and applying them here is what
 * lets "nobody answered yet" stay distinct from "somebody answered, and the
 * answer happens to equal the default" — see residentIntakeInitialValues.
 */
export function factorDisplayValue(factor: FactorDef, value: unknown): unknown {
  if (value !== null && value !== undefined) return value
  switch (factor.type) {
    case 'scale':
      return factor.default
    case 'boolean':
      return factor.default
    case 'multi':
      return factor.default ?? []
    case 'enum':
    case 'text':
      return factor.default ?? ''
  }
}
