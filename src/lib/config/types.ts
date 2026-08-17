/**
 * Factor Configuration Types
 *
 * This file defines the types for the configuration-driven factor system.
 * The actual factor definitions live in resident-factors.ts and housing-factors.ts.
 */

// =============================================================================
// FACTOR TYPES
// =============================================================================

export type FactorType =
  | 'enum'        // Single selection from options
  | 'scale'       // 1-5 numeric scale
  | 'boolean'     // Yes/No toggle
  | 'multi'       // Multiple selection (checkboxes)
  | 'text'        // Free text input

export type CompatibilityRule =
  | 'SAME_IS_BETTER'           // Same values score higher (e.g., sleep schedule)
  | 'SIMILAR_IS_BETTER'        // Closer values score higher (e.g., cleanliness 1-5)
  | 'OVERLAP_IS_BETTER'        // More overlap scores higher (e.g., languages)
  | 'MUST_MATCH'               // Hard requirement - must match or fail
  | 'MUST_ALLOW'               // Housing must allow resident need (e.g., smoking)
  | 'MUST_HAVE'                // Housing must have feature (e.g., wheelchair access)
  | 'HIGHER_TOLERANCE_BETTER'  // Higher housing tolerance = more compatible
  | 'NONE'                     // No compatibility impact (display only)

// =============================================================================
// FACTOR DEFINITIONS
// =============================================================================

interface BaseFactorDef {
  id: string
  label: string
  description?: string
  required?: boolean
  formSection: string
  formOrder: number
  /**
   * Short intake shows `essential` first so a caseworker with ten minutes
   * can place someone. Everything else lives behind "Weitere Angaben".
   * Unset means detail — never silently required on the fast path.
   */
  intake?: 'essential' | 'detail'
}

export interface EnumFactorDef extends BaseFactorDef {
  type: 'enum'
  options: readonly string[]
  optionLabels: Record<string, string>
  default?: string
}

export interface ScaleFactorDef extends BaseFactorDef {
  type: 'scale'
  min: number
  max: number
  default: number
  lowLabel: string
  highLabel: string
}

export interface BooleanFactorDef extends BaseFactorDef {
  type: 'boolean'
  default: boolean
  trueLabel?: string
  falseLabel?: string
}

export interface MultiFactorDef extends BaseFactorDef {
  type: 'multi'
  options: readonly string[]
  optionLabels: Record<string, string>
  default?: string[]
}

export interface TextFactorDef extends BaseFactorDef {
  type: 'text'
  placeholder?: string
  default?: string
}

export type FactorDef =
  | EnumFactorDef
  | ScaleFactorDef
  | BooleanFactorDef
  | MultiFactorDef
  | TextFactorDef

// =============================================================================
// COMPATIBILITY FACTOR (extends base with scoring info)
// =============================================================================

export type CompatibilityFactorDef = FactorDef & {
  dimension: 'lifestyle' | 'social' | 'practical' | 'requirements'
  weight: number // Weight within dimension (0-1)
  rule: CompatibilityRule
  // For MUST_MATCH/MUST_ALLOW/MUST_HAVE rules
  housingField?: string // The corresponding housing field to check against
}

// =============================================================================
// HOUSING FACTOR (for housing units)
// =============================================================================

export type HousingFactorDef = FactorDef & {
  category: 'capacity' | 'facilities' | 'accessibility' | 'rules' | 'location'
}

// =============================================================================
// DIMENSION CONFIG
// =============================================================================

export interface DimensionConfig {
  id: string
  label: string
  weight: number // Overall weight in compatibility score (all should sum to 1)
  description: string
}

// =============================================================================
// FORM SECTION CONFIG
// =============================================================================

export interface FormSectionConfig {
  id: string
  label: string
  description?: string
  order: number
}
