/**
 * Placement Spot Configuration
 *
 * SSOT for spot types, labels, and capacity calculation
 */

export const SPOT_TYPE_CONFIG = {
  BED: {
    id: 'BED',
    label: 'Bett (geteiltes Zimmer)',
    labelShort: 'Bett',
    icon: '🛏️',
    requiresMedicalDocs: false,
    isDefault: true,
    isContainer: false,
    description: 'Schlafplatz in einem geteilten Zimmer',
  },
  PRIVATE_ROOM: {
    id: 'PRIVATE_ROOM',
    label: 'Einzelzimmer',
    labelShort: 'Zimmer',
    icon: '🚪',
    requiresMedicalDocs: true,
    isDefault: false,
    isContainer: false,
    description: 'Eigenes Zimmer, geteilte Nasszellen',
  },
  STUDIO: {
    id: 'STUDIO',
    label: 'Studio/Apartment',
    labelShort: 'Studio',
    icon: '🏠',
    requiresMedicalDocs: true,
    isDefault: false,
    isContainer: false,
    description: 'Eigene Wohnung mit Bad und Küche',
  },
  ROOM: {
    id: 'ROOM',
    label: 'Zimmer (Container)',
    labelShort: 'Zimmer',
    icon: '📦',
    requiresMedicalDocs: false,
    isDefault: false,
    isContainer: true,
    description: 'Container für Betten (nicht direkt zuweisbar)',
  },
} as const

export type SpotTypeKey = keyof typeof SPOT_TYPE_CONFIG

// Labels for dropdowns and displays
export const SPOT_TYPE_LABELS: Record<SpotTypeKey, string> = {
  BED: SPOT_TYPE_CONFIG.BED.label,
  PRIVATE_ROOM: SPOT_TYPE_CONFIG.PRIVATE_ROOM.label,
  STUDIO: SPOT_TYPE_CONFIG.STUDIO.label,
  ROOM: SPOT_TYPE_CONFIG.ROOM.label,
}

export const SPOT_TYPE_LABELS_SHORT: Record<SpotTypeKey, string> = {
  BED: SPOT_TYPE_CONFIG.BED.labelShort,
  PRIVATE_ROOM: SPOT_TYPE_CONFIG.PRIVATE_ROOM.labelShort,
  STUDIO: SPOT_TYPE_CONFIG.STUDIO.labelShort,
  ROOM: SPOT_TYPE_CONFIG.ROOM.labelShort,
}

export const SPOT_TYPE_ICONS: Record<SpotTypeKey, string> = {
  BED: SPOT_TYPE_CONFIG.BED.icon,
  PRIVATE_ROOM: SPOT_TYPE_CONFIG.PRIVATE_ROOM.icon,
  STUDIO: SPOT_TYPE_CONFIG.STUDIO.icon,
  ROOM: SPOT_TYPE_CONFIG.ROOM.icon,
}

// Spot status configuration
export const SPOT_STATUS_CONFIG = {
  AVAILABLE: {
    id: 'AVAILABLE',
    label: 'Verfügbar',
    color: 'green',
  },
  OCCUPIED: {
    id: 'OCCUPIED',
    label: 'Belegt',
    color: 'blue',
  },
  MAINTENANCE: {
    id: 'MAINTENANCE',
    label: 'Wartung',
    color: 'yellow',
  },
  CLOSED: {
    id: 'CLOSED',
    label: 'Geschlossen',
    color: 'gray',
  },
} as const

export type SpotStatusKey = keyof typeof SPOT_STATUS_CONFIG

export const SPOT_STATUS_LABELS: Record<SpotStatusKey, string> = {
  AVAILABLE: SPOT_STATUS_CONFIG.AVAILABLE.label,
  OCCUPIED: SPOT_STATUS_CONFIG.OCCUPIED.label,
  MAINTENANCE: SPOT_STATUS_CONFIG.MAINTENANCE.label,
  CLOSED: SPOT_STATUS_CONFIG.CLOSED.label,
}

// Medical documentation type configuration
export const MEDICAL_DOC_TYPE_CONFIG = {
  PRIVATE_ROOM: {
    id: 'PRIVATE_ROOM',
    label: 'Einzelzimmer',
    description: 'Berechtigt zur Unterbringung in einem Einzelzimmer',
    allowedSpotTypes: ['PRIVATE_ROOM'] as SpotTypeKey[],
  },
  STUDIO: {
    id: 'STUDIO',
    label: 'Studio/Wohnung',
    description: 'Berechtigt zur Unterbringung in einem Studio oder einer eigenen Wohnung',
    allowedSpotTypes: ['STUDIO'] as SpotTypeKey[],
  },
  BOTH: {
    id: 'BOTH',
    label: 'Einzelzimmer oder Studio',
    description: 'Berechtigt zur Unterbringung in einem Einzelzimmer oder Studio',
    allowedSpotTypes: ['PRIVATE_ROOM', 'STUDIO'] as SpotTypeKey[],
  },
} as const

export type MedicalDocTypeKey = keyof typeof MEDICAL_DOC_TYPE_CONFIG

export const MEDICAL_DOC_TYPE_LABELS: Record<MedicalDocTypeKey, string> = {
  PRIVATE_ROOM: MEDICAL_DOC_TYPE_CONFIG.PRIVATE_ROOM.label,
  STUDIO: MEDICAL_DOC_TYPE_CONFIG.STUDIO.label,
  BOTH: MEDICAL_DOC_TYPE_CONFIG.BOTH.label,
}

// Capacity calculation from square meters (Swiss standards)
export const CAPACITY_CONFIG = {
  MIN_SQM_PER_BED: 4,
  RECOMMENDED_SQM_PER_BED: 6,
  MAX_BEDS_PER_ROOM: 6,
} as const

/**
 * Calculate bed capacity from square meters (Swiss standards)
 */
export function calculateBedCapacity(sqm: number): number {
  const rawCapacity = Math.floor(sqm / CAPACITY_CONFIG.MIN_SQM_PER_BED)
  return Math.min(rawCapacity, CAPACITY_CONFIG.MAX_BEDS_PER_ROOM)
}

/**
 * Get eligible spot types for a resident based on medical documentation
 */
export function getEligibleSpotTypes(
  hasMedicalDocs: boolean,
  medicalDocType?: MedicalDocTypeKey | null
): SpotTypeKey[] {
  // Everyone can be placed in a bed
  const eligible: SpotTypeKey[] = ['BED']

  if (hasMedicalDocs && medicalDocType) {
    const config = MEDICAL_DOC_TYPE_CONFIG[medicalDocType]
    if (config) {
      eligible.push(...config.allowedSpotTypes)
    }
  }

  return eligible
}

/**
 * Get assignable spot types (excludes containers like ROOM)
 */
export function getAssignableSpotTypes(): SpotTypeKey[] {
  return (Object.keys(SPOT_TYPE_CONFIG) as SpotTypeKey[]).filter(
    (key) => !SPOT_TYPE_CONFIG[key].isContainer
  )
}
