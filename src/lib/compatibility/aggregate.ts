/**
 * Apartment-level aggregate profile calculation
 *
 * Calculates aggregate profiles from current residents and evaluates
 * how well a new resident would fit with the apartment's collective personality.
 */

import type {
  ResidentProfile,
  ApartmentProfile,
  ApartmentCompatibility,
  ApartmentConflict,
  SleepSchedule,
  SocialStyle,
  SmokingStatus,
} from './types'
import { APARTMENT_THRESHOLDS } from '@/lib/config/apartment-thresholds'
import { FIT_SCORE_CONFIG } from '@/lib/config/thresholds'
import {
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  SOCIAL_STYLE_LABELS,
  getLabel,
} from '@/lib/constants/labels'

/**
 * Calculate apartment aggregate profile from current residents
 */
export function calculateApartmentProfile(residents: ResidentProfile[]): ApartmentProfile {
  const isEmpty = residents.length === 0

  if (isEmpty) {
    return {
      unitId: '',
      currentResidentCount: 0,
      isEmpty: true,
      avgNoiseTolerance: null,
      avgCleanlinessLevel: null,
      avgPrivacyNeed: null,
      avgChoresContribution: null,
      dominantSleepSchedule: null,
      sleepScheduleDistribution: {
        EARLY_BIRD: 0,
        STANDARD: 0,
        NIGHT_OWL: 0,
        IRREGULAR: 0,
      },
      dominantSocialStyle: null,
      dominantSmokingStatus: null,
      commonLanguages: [],
      percentNeedsQuiet: 0,
      percentHasNightDisturbances: 0,
    }
  }

  // Numeric averages
  const avgNoiseTolerance = average(residents.map(r => r.noiseTolerance))
  const avgCleanlinessLevel = average(residents.map(r => r.cleanlinessLevel))
  const avgPrivacyNeed = average(residents.map(r => r.privacyNeed))
  const avgChoresContribution = average(residents.map(r => r.choresContribution))

  // Enum distributions and dominants
  const sleepScheduleDistribution = distribution(residents.map(r => r.sleepSchedule))
  const dominantSleepSchedule = findMode(residents.map(r => r.sleepSchedule))
  const dominantSocialStyle = findMode(residents.map(r => r.socialStyle))
  const dominantSmokingStatus = findMode(residents.map(r => r.smokingStatus))

  // Language overlap
  const languageCounts: Record<string, number> = {}
  residents.forEach(r => {
    r.languages.forEach(lang => {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    })
  })
  const commonLanguages = Object.entries(languageCounts)
    .filter(([_, count]) => count >= 2)
    .map(([lang]) => lang)
    .sort((a, b) => languageCounts[b] - languageCounts[a])

  // Boolean percentages
  const needsQuietCount = residents.filter(r => r.needsQuietEnvironment).length
  const nightDisturbancesCount = residents.filter(r => r.hasNightDisturbances).length
  const percentNeedsQuiet = (needsQuietCount / residents.length) * 100
  const percentHasNightDisturbances = (nightDisturbancesCount / residents.length) * 100

  return {
    unitId: '',
    currentResidentCount: residents.length,
    isEmpty: false,
    avgNoiseTolerance,
    avgCleanlinessLevel,
    avgPrivacyNeed,
    avgChoresContribution,
    dominantSleepSchedule,
    sleepScheduleDistribution,
    dominantSocialStyle,
    dominantSmokingStatus,
    commonLanguages,
    percentNeedsQuiet,
    percentHasNightDisturbances,
  }
}

/**
 * Calculate how well a new resident fits with an apartment's aggregate profile
 */
export function calculateApartmentFit(
  newResident: ResidentProfile,
  apartmentProfile: ApartmentProfile
): ApartmentCompatibility {
  const conflicts: ApartmentConflict[] = []
  const strengths: string[] = []
  const warnings: string[] = []

  // Empty apartment is always a perfect fit
  if (apartmentProfile.isEmpty) {
    return {
      apartmentProfile,
      fitScore: 100,
      conflicts: [],
      strengths: ['Erste Person in der Wohnung - keine Konflikte möglich'],
      warnings: [],
    }
  }

  // Check cleanliness compatibility
  if (apartmentProfile.avgCleanlinessLevel !== null) {
    const diff = Math.abs(newResident.cleanlinessLevel - apartmentProfile.avgCleanlinessLevel)

    if (diff >= APARTMENT_THRESHOLDS.cleanliness.BLOCKING) {
      conflicts.push({
        attribute: 'cleanlinessLevel',
        severity: 'BLOCKING',
        message: `Extreme Sauberkeitsdifferenz: Person ${newResident.cleanlinessLevel}/5, Wohnung Ø ${apartmentProfile.avgCleanlinessLevel.toFixed(1)}/5`,
        residentValue: newResident.cleanlinessLevel,
        apartmentAverage: apartmentProfile.avgCleanlinessLevel,
      })
    } else if (diff >= APARTMENT_THRESHOLDS.cleanliness.HIGH) {
      conflicts.push({
        attribute: 'cleanlinessLevel',
        severity: 'HIGH',
        message: `Große Sauberkeitsdifferenz: Person ${newResident.cleanlinessLevel}/5, Wohnung Ø ${apartmentProfile.avgCleanlinessLevel.toFixed(1)}/5`,
        residentValue: newResident.cleanlinessLevel,
        apartmentAverage: apartmentProfile.avgCleanlinessLevel,
      })
    } else if (diff >= APARTMENT_THRESHOLDS.cleanliness.MEDIUM) {
      conflicts.push({
        attribute: 'cleanlinessLevel',
        severity: 'MEDIUM',
        message: `Moderate Sauberkeitsdifferenz: Person ${newResident.cleanlinessLevel}/5, Wohnung Ø ${apartmentProfile.avgCleanlinessLevel.toFixed(1)}/5`,
        residentValue: newResident.cleanlinessLevel,
        apartmentAverage: apartmentProfile.avgCleanlinessLevel,
      })
    } else if (diff <= 0.5) {
      strengths.push(`Ähnliches Sauberkeitsniveau (${newResident.cleanlinessLevel}/5)`)
    }
  }

  // Check noise tolerance compatibility
  if (apartmentProfile.avgNoiseTolerance !== null) {
    const diff = Math.abs(newResident.noiseTolerance - apartmentProfile.avgNoiseTolerance)

    if (diff >= APARTMENT_THRESHOLDS.noiseTolerance.HIGH) {
      conflicts.push({
        attribute: 'noiseTolerance',
        severity: 'HIGH',
        message: `Große Lärmtoleranz-Differenz: Person ${newResident.noiseTolerance}/5, Wohnung Ø ${apartmentProfile.avgNoiseTolerance.toFixed(1)}/5`,
        residentValue: newResident.noiseTolerance,
        apartmentAverage: apartmentProfile.avgNoiseTolerance,
      })
    } else if (diff >= APARTMENT_THRESHOLDS.noiseTolerance.MEDIUM) {
      conflicts.push({
        attribute: 'noiseTolerance',
        severity: 'MEDIUM',
        message: `Moderate Lärmtoleranz-Differenz: Person ${newResident.noiseTolerance}/5, Wohnung Ø ${apartmentProfile.avgNoiseTolerance.toFixed(1)}/5`,
        residentValue: newResident.noiseTolerance,
        apartmentAverage: apartmentProfile.avgNoiseTolerance,
      })
    } else if (diff <= 0.5) {
      strengths.push(`Ähnliche Lärmtoleranz (${newResident.noiseTolerance}/5)`)
    }
  }

  // Check chores contribution compatibility
  if (apartmentProfile.avgChoresContribution !== null) {
    const diff = Math.abs(newResident.choresContribution - apartmentProfile.avgChoresContribution)

    if (diff >= APARTMENT_THRESHOLDS.choresContribution.MEDIUM) {
      conflicts.push({
        attribute: 'choresContribution',
        severity: 'MEDIUM',
        message: `Unterschiedliche Hausarbeit-Beteiligung: Person ${newResident.choresContribution}/5, Wohnung Ø ${apartmentProfile.avgChoresContribution.toFixed(1)}/5`,
        residentValue: newResident.choresContribution,
        apartmentAverage: apartmentProfile.avgChoresContribution,
      })
    } else if (diff >= APARTMENT_THRESHOLDS.choresContribution.LOW) {
      conflicts.push({
        attribute: 'choresContribution',
        severity: 'LOW',
        message: `Leichte Hausarbeit-Differenz: Person ${newResident.choresContribution}/5, Wohnung Ø ${apartmentProfile.avgChoresContribution.toFixed(1)}/5`,
        residentValue: newResident.choresContribution,
        apartmentAverage: apartmentProfile.avgChoresContribution,
      })
    }
  }

  // Check sleep schedule compatibility
  if (apartmentProfile.dominantSleepSchedule) {
    const isConflicting =
      (newResident.sleepSchedule === 'EARLY_BIRD' && apartmentProfile.dominantSleepSchedule === 'NIGHT_OWL') ||
      (newResident.sleepSchedule === 'NIGHT_OWL' && apartmentProfile.dominantSleepSchedule === 'EARLY_BIRD')

    if (isConflicting) {
      const dominantPercent = apartmentProfile.sleepScheduleDistribution[apartmentProfile.dominantSleepSchedule]
      const residentSleepLabel = getLabel(SLEEP_SCHEDULE_LABELS, newResident.sleepSchedule)
      const apartmentSleepLabel = getLabel(SLEEP_SCHEDULE_LABELS, apartmentProfile.dominantSleepSchedule)
      if (dominantPercent >= 70) {
        conflicts.push({
          attribute: 'sleepSchedule',
          severity: 'HIGH',
          message: `Schlafrhythmus-Konflikt: ${residentSleepLabel} vs. ${dominantPercent.toFixed(0)}% ${apartmentSleepLabel}`,
          residentValue: newResident.sleepSchedule,
          apartmentAverage: apartmentProfile.dominantSleepSchedule,
        })
      } else {
        conflicts.push({
          attribute: 'sleepSchedule',
          severity: 'MEDIUM',
          message: `Schlafrhythmus-Unterschied: ${residentSleepLabel} vs. ${apartmentSleepLabel}`,
          residentValue: newResident.sleepSchedule,
          apartmentAverage: apartmentProfile.dominantSleepSchedule,
        })
      }
    } else if (newResident.sleepSchedule === apartmentProfile.dominantSleepSchedule) {
      strengths.push(`Passender Schlafrhythmus (${getLabel(SLEEP_SCHEDULE_LABELS, newResident.sleepSchedule)})`)
    }
  }

  // Check quiet environment needs vs night disturbances
  if (newResident.needsQuietEnvironment && apartmentProfile.percentHasNightDisturbances >= APARTMENT_THRESHOLDS.nightDisturbances.HIGH) {
    conflicts.push({
      attribute: 'quietEnvironment',
      severity: 'HIGH',
      message: `Ruhe-Bedürfnis vs. ${apartmentProfile.percentHasNightDisturbances.toFixed(0)}% mit nächtlichen Störungen`,
      residentValue: 'Braucht Ruhe',
      apartmentAverage: `${apartmentProfile.percentHasNightDisturbances.toFixed(0)}% Störungen`,
    })
  } else if (newResident.needsQuietEnvironment && apartmentProfile.percentHasNightDisturbances < 20) {
    strengths.push('Ruhige Umgebung vorhanden')
  }

  // Check language overlap
  const sharedLanguages = newResident.languages.filter(lang =>
    apartmentProfile.commonLanguages.includes(lang)
  )
  if (sharedLanguages.length > 0) {
    strengths.push(`Gemeinsame Sprache: ${sharedLanguages.join(', ')}`)
  } else if (apartmentProfile.commonLanguages.length > 0) {
    warnings.push('Keine gemeinsame Sprache mit Mehrheit')
  }

  // Check smoking compatibility
  if (apartmentProfile.dominantSmokingStatus) {
    if (newResident.smokingStatus === 'NON_SMOKER' && apartmentProfile.dominantSmokingStatus !== 'NON_SMOKER') {
      conflicts.push({
        attribute: 'smokingStatus',
        severity: 'MEDIUM',
        message: `Nichtraucher in Wohnung mit ${getLabel(SMOKING_STATUS_LABELS, apartmentProfile.dominantSmokingStatus)}`,
        residentValue: newResident.smokingStatus,
        apartmentAverage: apartmentProfile.dominantSmokingStatus,
      })
    } else if (newResident.smokingStatus === apartmentProfile.dominantSmokingStatus) {
      strengths.push(`Übereinstimmender Rauchstatus (${getLabel(SMOKING_STATUS_LABELS, newResident.smokingStatus)})`)
    }
  }

  // Check social style compatibility
  if (apartmentProfile.dominantSocialStyle) {
    if (newResident.socialStyle === apartmentProfile.dominantSocialStyle) {
      strengths.push(`Ähnlicher Sozialstil (${getLabel(SOCIAL_STYLE_LABELS, newResident.socialStyle)})`)
    } else if (
      (newResident.socialStyle === 'INTROVERTED' && apartmentProfile.dominantSocialStyle === 'EXTROVERTED') ||
      (newResident.socialStyle === 'EXTROVERTED' && apartmentProfile.dominantSocialStyle === 'INTROVERTED')
    ) {
      conflicts.push({
        attribute: 'socialStyle',
        severity: 'LOW',
        message: `Unterschiedlicher Sozialstil: ${getLabel(SOCIAL_STYLE_LABELS, newResident.socialStyle)} vs. ${getLabel(SOCIAL_STYLE_LABELS, apartmentProfile.dominantSocialStyle)}`,
        residentValue: newResident.socialStyle,
        apartmentAverage: apartmentProfile.dominantSocialStyle,
      })
    }
  }

  // Calculate fit score
  const fitScore = calculateFitScore(conflicts, strengths, apartmentProfile.currentResidentCount)

  return {
    apartmentProfile,
    fitScore,
    conflicts,
    strengths,
    warnings,
  }
}

/**
 * Calculate fit score from 0-100 based on conflicts and strengths
 * Uses FIT_SCORE_CONFIG from thresholds.ts (SSOT)
 */
function calculateFitScore(
  conflicts: ApartmentConflict[],
  strengths: string[],
  residentCount: number
): number {
  const { penalties, bonuses } = FIT_SCORE_CONFIG
  let score = 100

  // Deduct points for conflicts using config values
  conflicts.forEach(conflict => {
    score -= penalties[conflict.severity] ?? 0
  })

  // Add bonus for strengths (capped)
  const strengthBonus = Math.min(
    strengths.length * bonuses.perStrength,
    bonuses.maxStrengthBonus
  )
  score += strengthBonus

  // Slight bonus for joining a smaller group (easier integration)
  if (residentCount <= bonuses.smallGroupThreshold) {
    score += bonuses.smallGroup
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate average of numbers
 */
function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null
  const sum = numbers.reduce((acc, n) => acc + n, 0)
  return sum / numbers.length
}

/**
 * Find the most common value (mode) in an array
 */
function findMode<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null

  const counts: Record<string, number> = {}
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1
  })

  let maxCount = 0
  let mode: T | null = null

  Object.entries(counts).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count
      mode = value as T
    }
  })

  return mode
}

/**
 * Calculate percentage distribution of enum values
 */
function distribution<T extends string>(values: T[]): Record<T, number> {
  if (values.length === 0) return {} as Record<T, number>

  const counts: Record<string, number> = {}
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1
  })

  const percentages: Record<string, number> = {}
  Object.entries(counts).forEach(([value, count]) => {
    percentages[value] = (count / values.length) * 100
  })

  return percentages as Record<T, number>
}
