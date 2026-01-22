/**
 * Core compatibility scoring algorithm
 * 
 * Calculates how well two residents would live together
 * based on lifestyle, social, and practical factors.
 */

import type {
  ResidentProfile,
  CompatibilityScore,
  CompatibilityWeights,
  DimensionResult,
  FactorResult,
} from './types'

const DEFAULT_WEIGHTS: CompatibilityWeights = {
  lifestyle: 30,
  social: 25,
  practical: 25,
  risk: 20,
}

/**
 * Calculate overall compatibility between two residents
 */
export function calculateCompatibility(
  resident1: ResidentProfile,
  resident2: ResidentProfile,
  weights: CompatibilityWeights = DEFAULT_WEIGHTS
): CompatibilityScore {
  const lifestyle = calculateLifestyleCompatibility(resident1, resident2)
  const social = calculateSocialCompatibility(resident1, resident2)
  const practical = calculatePracticalCompatibility(resident1, resident2)
  const risk = calculateRiskFactors(resident1, resident2)

  // Weighted average (risk is inverted - lower risk = higher compatibility)
  const overall = Math.round(
    (lifestyle.score * weights.lifestyle +
      social.score * weights.social +
      practical.score * weights.practical +
      (100 - risk.score) * weights.risk) /
      (weights.lifestyle + weights.social + weights.practical + weights.risk)
  )

  const { strengths, concerns, recommendations } = generateInsights(
    resident1,
    resident2,
    { lifestyle, social, practical, risk }
  )

  return {
    overall,
    lifestyle: lifestyle.score,
    social: social.score,
    practical: practical.score,
    risk: risk.score,
    strengths,
    concerns,
    recommendations,
  }
}

/**
 * Lifestyle compatibility: sleep, noise, cleanliness
 */
function calculateLifestyleCompatibility(
  r1: ResidentProfile,
  r2: ResidentProfile
): DimensionResult {
  const factors: FactorResult[] = []

  // Sleep schedule compatibility
  const sleepScore = calculateSleepCompatibility(r1.sleepSchedule, r2.sleepSchedule)
  factors.push({
    name: 'sleep_schedule',
    score: sleepScore,
    weight: 40,
    note: sleepScore < 50 ? 'Unterschiedliche Schlafzeiten' : undefined,
  })

  // Noise tolerance (closer values = better)
  const noiseDiff = Math.abs(r1.noiseTolerance - r2.noiseTolerance)
  const noiseScore = 100 - noiseDiff * 20
  factors.push({
    name: 'noise_tolerance',
    score: noiseScore,
    weight: 30,
    note: noiseDiff > 2 ? 'Unterschiedliche Lärmtoleranz' : undefined,
  })

  // Cleanliness (closer values = better)
  const cleanDiff = Math.abs(r1.cleanlinessLevel - r2.cleanlinessLevel)
  const cleanScore = 100 - cleanDiff * 20
  factors.push({
    name: 'cleanliness',
    score: cleanScore,
    weight: 30,
    note: cleanDiff > 2 ? 'Unterschiedliche Sauberkeitsstandards' : undefined,
  })

  return {
    score: weightedAverage(factors),
    factors,
  }
}

/**
 * Social compatibility: communication style, language, social needs
 */
function calculateSocialCompatibility(
  r1: ResidentProfile,
  r2: ResidentProfile
): DimensionResult {
  const factors: FactorResult[] = []

  // Social style compatibility
  const socialStyleScore = calculateSocialStyleCompatibility(r1.socialStyle, r2.socialStyle)
  factors.push({
    name: 'social_style',
    score: socialStyleScore,
    weight: 35,
  })

  // Language overlap
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  const languageScore = sharedLanguages.length > 0 ? 100 : 30
  factors.push({
    name: 'language',
    score: languageScore,
    weight: 40,
    note: sharedLanguages.length === 0 ? 'Keine gemeinsame Sprache' : undefined,
  })

  // Privacy needs compatibility
  const privacyDiff = Math.abs(r1.privacyNeed - r2.privacyNeed)
  const privacyScore = 100 - privacyDiff * 15
  factors.push({
    name: 'privacy_needs',
    score: privacyScore,
    weight: 25,
  })

  return {
    score: weightedAverage(factors),
    factors,
  }
}

/**
 * Practical compatibility: smoking, diet, shared spaces
 */
function calculatePracticalCompatibility(
  r1: ResidentProfile,
  r2: ResidentProfile
): DimensionResult {
  const factors: FactorResult[] = []

  // Smoking compatibility
  const smokingScore = calculateSmokingCompatibility(r1.smokingStatus, r2.smokingStatus)
  factors.push({
    name: 'smoking',
    score: smokingScore,
    weight: 40,
    note: smokingScore < 50 ? 'Raucher/Nichtraucher Konflikt möglich' : undefined,
  })

  // Shared space preferences
  const sharedSpaceScore = calculateSharedSpaceCompatibility(r1, r2)
  factors.push({
    name: 'shared_spaces',
    score: sharedSpaceScore,
    weight: 30,
  })

  // Pet tolerance
  const petScore = r1.petTolerance === r2.petTolerance ? 100 : 60
  factors.push({
    name: 'pets',
    score: petScore,
    weight: 15,
  })

  // Dietary compatibility (kitchen sharing)
  const dietScore = calculateDietaryCompatibility(r1.dietaryNeeds, r2.dietaryNeeds)
  factors.push({
    name: 'dietary',
    score: dietScore,
    weight: 15,
  })

  return {
    score: weightedAverage(factors),
    factors,
  }
}

/**
 * Risk factors: things that could cause conflict
 */
function calculateRiskFactors(
  r1: ResidentProfile,
  r2: ResidentProfile
): DimensionResult {
  const factors: FactorResult[] = []
  let totalRisk = 0

  // Age gap risk (very different ages can create friction)
  const ageGapRisk = calculateAgeGapRisk(r1.ageRange, r2.ageRange)
  if (ageGapRisk > 0) {
    factors.push({ name: 'age_gap', score: ageGapRisk, weight: 1 })
    totalRisk += ageGapRisk * 0.15
  }

  // No shared language is a significant risk
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  if (sharedLanguages.length === 0) {
    factors.push({ name: 'communication_barrier', score: 40, weight: 1 })
    totalRisk += 40 * 0.25
  }

  // Smoking mismatch risk
  if (
    (r1.smokingStatus === 'INDOOR_SMOKER' && r2.smokingStatus === 'NON_SMOKER') ||
    (r2.smokingStatus === 'INDOOR_SMOKER' && r1.smokingStatus === 'NON_SMOKER')
  ) {
    factors.push({ name: 'smoking_conflict', score: 50, weight: 1 })
    totalRisk += 50 * 0.2
  }

  // Sleep schedule conflict risk
  if (
    (r1.sleepSchedule === 'EARLY_BIRD' && r2.sleepSchedule === 'NIGHT_OWL') ||
    (r2.sleepSchedule === 'EARLY_BIRD' && r1.sleepSchedule === 'NIGHT_OWL')
  ) {
    factors.push({ name: 'sleep_conflict', score: 35, weight: 1 })
    totalRisk += 35 * 0.2
  }

  // Extreme cleanliness difference
  if (Math.abs(r1.cleanlinessLevel - r2.cleanlinessLevel) >= 3) {
    factors.push({ name: 'cleanliness_conflict', score: 30, weight: 1 })
    totalRisk += 30 * 0.2
  }

  return {
    score: Math.min(100, Math.round(totalRisk)),
    factors,
  }
}

// ============================================================================
// Helper functions
// ============================================================================

function calculateSleepCompatibility(s1: string, s2: string): number {
  if (s1 === s2) return 100
  if (s1 === 'IRREGULAR' || s2 === 'IRREGULAR') return 70
  if (
    (s1 === 'EARLY_BIRD' && s2 === 'NIGHT_OWL') ||
    (s1 === 'NIGHT_OWL' && s2 === 'EARLY_BIRD')
  ) {
    return 30
  }
  return 70 // Adjacent schedules
}

function calculateSocialStyleCompatibility(s1: string, s2: string): number {
  if (s1 === s2) return 100
  if (s1 === 'MODERATE' || s2 === 'MODERATE') return 80
  // Introverted + Extroverted can work but needs care
  return 60
}

function calculateSmokingCompatibility(s1: string, s2: string): number {
  if (s1 === s2) return 100
  if (s1 === 'NON_SMOKER' && s2 === 'OUTDOOR_SMOKER') return 80
  if (s2 === 'NON_SMOKER' && s1 === 'OUTDOOR_SMOKER') return 80
  if (s1 === 'INDOOR_SMOKER' || s2 === 'INDOOR_SMOKER') {
    if (s1 === 'NON_SMOKER' || s2 === 'NON_SMOKER') return 20
    return 60
  }
  return 70
}

function calculateSharedSpaceCompatibility(r1: ResidentProfile, r2: ResidentProfile): number {
  let score = 100
  
  // Both need to accept shared spaces
  if (!r1.sharedBathroom && r2.sharedBathroom) score -= 20
  if (!r2.sharedBathroom && r1.sharedBathroom) score -= 20
  if (!r1.sharedKitchen && r2.sharedKitchen) score -= 15
  if (!r2.sharedKitchen && r1.sharedKitchen) score -= 15
  
  return Math.max(0, score)
}

function calculateDietaryCompatibility(d1: string[], d2: string[]): number {
  // Check for incompatible dietary requirements sharing a kitchen
  const hasHalal1 = d1.includes('halal')
  const hasHalal2 = d2.includes('halal')
  const hasKosher1 = d1.includes('kosher')
  const hasKosher2 = d2.includes('kosher')
  const hasVegan1 = d1.includes('vegan')
  const hasVegan2 = d2.includes('vegan')

  // Similar dietary needs are easier
  if (
    (hasHalal1 && hasHalal2) ||
    (hasKosher1 && hasKosher2) ||
    (hasVegan1 && hasVegan2)
  ) {
    return 100
  }

  // No special needs = easy
  if (d1.length === 0 && d2.length === 0) return 100

  // One has special needs, other doesn't = workable
  return 75
}

function calculateAgeGapRisk(a1: string, a2: string): number {
  const ageOrder = ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR']
  const idx1 = ageOrder.indexOf(a1)
  const idx2 = ageOrder.indexOf(a2)
  const gap = Math.abs(idx1 - idx2)
  
  if (gap === 0) return 0
  if (gap === 1) return 10
  if (gap === 2) return 25
  return 40 // Maximum gap (young adult + senior)
}

function weightedAverage(factors: FactorResult[]): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
  const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  return Math.round(weightedSum / totalWeight)
}

/**
 * Generate human-readable insights from scores
 */
function generateInsights(
  r1: ResidentProfile,
  r2: ResidentProfile,
  dimensions: {
    lifestyle: DimensionResult
    social: DimensionResult
    practical: DimensionResult
    risk: DimensionResult
  }
): { strengths: string[]; concerns: string[]; recommendations: string[] } {
  const strengths: string[] = []
  const concerns: string[] = []
  const recommendations: string[] = []

  // Analyze lifestyle
  if (dimensions.lifestyle.score >= 80) {
    strengths.push('Ähnlicher Lebensstil und Tagesrhythmus')
  }
  
  // Analyze social
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  if (sharedLanguages.length > 0) {
    strengths.push(`Gemeinsame Sprache: ${sharedLanguages.join(', ')}`)
  } else {
    concerns.push('Keine gemeinsame Sprache - Kommunikation schwierig')
    recommendations.push('Bildmaterial für Hausregeln bereitstellen')
  }

  // Analyze practical
  if (dimensions.practical.score < 50) {
    const smokingFactor = dimensions.practical.factors.find((f) => f.name === 'smoking')
    if (smokingFactor && smokingFactor.score < 50) {
      concerns.push('Raucher/Nichtraucher Konfliktpotential')
      recommendations.push('Klare Raucherzonen definieren')
    }
  }

  // Analyze risk
  if (dimensions.risk.score > 40) {
    recommendations.push('Regelmässige Check-ins in den ersten Wochen')
  }

  // Sleep schedule
  if (r1.sleepSchedule === 'EARLY_BIRD' && r2.sleepSchedule === 'NIGHT_OWL' ||
      r1.sleepSchedule === 'NIGHT_OWL' && r2.sleepSchedule === 'EARLY_BIRD') {
    concerns.push('Sehr unterschiedliche Schlafzeiten')
    recommendations.push('Räume möglichst weit voneinander platzieren')
  }

  // Positive factors
  if (r1.socialStyle === r2.socialStyle) {
    strengths.push('Ähnliche soziale Bedürfnisse')
  }

  return { strengths, concerns, recommendations }
}

// Re-export from shared utils for backwards compatibility
export {
  getScoreLabel,
  getScoreBadgeClass as getScoreClass,
} from '@/lib/utils/formatting'
