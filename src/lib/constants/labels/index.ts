/**
 * Labels barrel export — re-exports all domain-specific label files
 *
 * Consumers can import from here or from specific domain files:
 *   import { PORTAL_LABELS } from '@/lib/constants/labels'        // barrel
 *   import { PORTAL_LABELS } from '@/lib/constants/labels/portal'  // direct
 */

export { getLabel } from './helpers'
export * from './app'
export * from './incidents'
export * from './residents'
export * from './housing'
export * from './maintenance'
export * from './scores'
export * from './portal'
export * from './dashboard'
export * from './auth'
export * from './email'
export * from './export'
export * from './matching'
export * from './ui'
