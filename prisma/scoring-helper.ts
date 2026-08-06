/**
 * Scoring helper for seed file
 *
 * A self-contained compatibility calculation that doesn't use path aliases,
 * so it can be imported by the seed file running under ts-node.
 */

interface ResidentData {
  ageRange: string
  gender: string
  familyStatus: string
  sleepSchedule: string
  noiseTolerance: number
  cleanlinessPractice: number
  socialStyle: string
  languages: string[]
  culturalRegion?: string | null
  smokingStatus: string
  dietaryNeeds: string[]
  mobilityNeeds: string
  medicalEquipment: boolean
  petTolerance: boolean
  sharedBathroom: boolean
  sharedKitchen: boolean
  privacyNeed: number
  choresContribution: number
  recyclingKnowledge: string
  roomSharingStatus: string
  hasNightDisturbances: boolean
  needsQuietEnvironment: boolean
  hasSleepEquipment: boolean
  supportLevel: string
}

interface ScoreResult {
  compatibilityScore: number
  lifestyleScore: number
  socialScore: number
  practicalScore: number
  riskScore: number
  strengths: string[]
  concerns: string[]
  recommendations: string[]
}

const WEIGHTS = {
  lifestyle: 30,
  social: 25,
  practical: 25,
  risk: 20,
}

/**
 * Calculate compatibility between two residents
 */
export function calculateScore(r1: ResidentData, r2: ResidentData): ScoreResult {
  const lifestyle = calculateLifestyle(r1, r2)
  const social = calculateSocial(r1, r2)
  const practical = calculatePractical(r1, r2)
  const risk = calculateRisk(r1, r2)

  // Weighted average (risk is inverted)
  const overall = Math.round(
    (lifestyle * WEIGHTS.lifestyle +
      social * WEIGHTS.social +
      practical * WEIGHTS.practical +
      (100 - risk) * WEIGHTS.risk) /
      (WEIGHTS.lifestyle + WEIGHTS.social + WEIGHTS.practical + WEIGHTS.risk)
  )

  const insights = generateInsights(r1, r2, { lifestyle, social, practical, risk })

  return {
    compatibilityScore: overall,
    lifestyleScore: lifestyle,
    socialScore: social,
    practicalScore: practical,
    riskScore: risk,
    ...insights,
  }
}

function calculateLifestyle(r1: ResidentData, r2: ResidentData): number {
  // Sleep schedule (40%)
  let sleepScore = 70
  if (r1.sleepSchedule === r2.sleepSchedule) sleepScore = 100
  else if (r1.sleepSchedule === 'IRREGULAR' || r2.sleepSchedule === 'IRREGULAR') sleepScore = 70
  else if (
    (r1.sleepSchedule === 'EARLY_BIRD' && r2.sleepSchedule === 'NIGHT_OWL') ||
    (r1.sleepSchedule === 'NIGHT_OWL' && r2.sleepSchedule === 'EARLY_BIRD')
  ) sleepScore = 30

  // Noise tolerance (30%)
  const noiseDiff = Math.abs(r1.noiseTolerance - r2.noiseTolerance)
  const noiseScore = 100 - noiseDiff * 20

  // Cleanliness (30%)
  const cleanDiff = Math.abs(r1.cleanlinessPractice - r2.cleanlinessPractice)
  const cleanScore = 100 - cleanDiff * 20

  return Math.round((sleepScore * 40 + noiseScore * 30 + cleanScore * 30) / 100)
}

function calculateSocial(r1: ResidentData, r2: ResidentData): number {
  // Social style (35%)
  let styleScore = 60
  if (r1.socialStyle === r2.socialStyle) styleScore = 100
  else if (r1.socialStyle === 'MODERATE' || r2.socialStyle === 'MODERATE') styleScore = 80

  // Language overlap (40%)
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  const languageScore = sharedLanguages.length > 0 ? 100 : 30

  // Privacy needs (25%)
  const privacyDiff = Math.abs(r1.privacyNeed - r2.privacyNeed)
  const privacyScore = 100 - privacyDiff * 15

  return Math.round((styleScore * 35 + languageScore * 40 + privacyScore * 25) / 100)
}

function calculatePractical(r1: ResidentData, r2: ResidentData): number {
  // Smoking (40%)
  let smokingScore = 70
  if (r1.smokingStatus === r2.smokingStatus) smokingScore = 100
  else if (
    (r1.smokingStatus === 'NON_SMOKER' && r2.smokingStatus === 'OUTDOOR_SMOKER') ||
    (r2.smokingStatus === 'NON_SMOKER' && r1.smokingStatus === 'OUTDOOR_SMOKER')
  ) smokingScore = 80
  else if (r1.smokingStatus === 'INDOOR_SMOKER' || r2.smokingStatus === 'INDOOR_SMOKER') {
    if (r1.smokingStatus === 'NON_SMOKER' || r2.smokingStatus === 'NON_SMOKER') smokingScore = 20
    else smokingScore = 60
  }

  // Shared spaces (30%)
  let sharedScore = 100
  if (!r1.sharedBathroom && r2.sharedBathroom) sharedScore -= 20
  if (!r2.sharedBathroom && r1.sharedBathroom) sharedScore -= 20
  if (!r1.sharedKitchen && r2.sharedKitchen) sharedScore -= 15
  if (!r2.sharedKitchen && r1.sharedKitchen) sharedScore -= 15
  sharedScore = Math.max(0, sharedScore)

  // Pet tolerance (15%)
  const petScore = r1.petTolerance === r2.petTolerance ? 100 : 60

  // Dietary (15%)
  const hasHalal1 = r1.dietaryNeeds.includes('halal')
  const hasHalal2 = r2.dietaryNeeds.includes('halal')
  const hasKosher1 = r1.dietaryNeeds.includes('kosher')
  const hasKosher2 = r2.dietaryNeeds.includes('kosher')
  const hasVegan1 = r1.dietaryNeeds.includes('vegan')
  const hasVegan2 = r2.dietaryNeeds.includes('vegan')
  let dietScore = 75
  if ((hasHalal1 && hasHalal2) || (hasKosher1 && hasKosher2) || (hasVegan1 && hasVegan2)) dietScore = 100
  else if (r1.dietaryNeeds.length === 0 && r2.dietaryNeeds.length === 0) dietScore = 100

  return Math.round((smokingScore * 40 + sharedScore * 30 + petScore * 15 + dietScore * 15) / 100)
}

function calculateRisk(r1: ResidentData, r2: ResidentData): number {
  let totalRisk = 0

  // Age gap risk
  const ageOrder = ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR']
  const ageGap = Math.abs(ageOrder.indexOf(r1.ageRange) - ageOrder.indexOf(r2.ageRange))
  if (ageGap === 2) totalRisk += 25 * 0.15
  else if (ageGap >= 3) totalRisk += 40 * 0.15

  // No shared language
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  if (sharedLanguages.length === 0) totalRisk += 40 * 0.25

  // Smoking mismatch
  if (
    (r1.smokingStatus === 'INDOOR_SMOKER' && r2.smokingStatus === 'NON_SMOKER') ||
    (r2.smokingStatus === 'INDOOR_SMOKER' && r1.smokingStatus === 'NON_SMOKER')
  ) totalRisk += 50 * 0.2

  // Sleep conflict
  if (
    (r1.sleepSchedule === 'EARLY_BIRD' && r2.sleepSchedule === 'NIGHT_OWL') ||
    (r2.sleepSchedule === 'EARLY_BIRD' && r1.sleepSchedule === 'NIGHT_OWL')
  ) totalRisk += 35 * 0.2

  // Extreme cleanliness difference
  if (Math.abs(r1.cleanlinessPractice - r2.cleanlinessPractice) >= 3) totalRisk += 30 * 0.2

  // Room sharing need
  if (r1.roomSharingStatus === 'NEEDS_PRIVATE' || r2.roomSharingStatus === 'NEEDS_PRIVATE') {
    totalRisk += 80 * 0.3
  }

  // Night disturbances
  if (r1.hasNightDisturbances || r2.hasNightDisturbances) {
    const disturbanceRisk =
      (r1.hasNightDisturbances && r2.needsQuietEnvironment) ||
      (r2.hasNightDisturbances && r1.needsQuietEnvironment)
        ? 60
        : 25
    totalRisk += disturbanceRisk * 0.15
  }

  return Math.min(100, Math.round(totalRisk))
}

function generateInsights(
  r1: ResidentData,
  r2: ResidentData,
  scores: { lifestyle: number; social: number; practical: number; risk: number }
): { strengths: string[]; concerns: string[]; recommendations: string[] } {
  const strengths: string[] = []
  const concerns: string[] = []
  const recommendations: string[] = []

  // Lifestyle
  if (scores.lifestyle >= 80) strengths.push('Ähnlicher Lebensstil und Tagesrhythmus')

  // Social - language
  const sharedLanguages = r1.languages.filter((l) => r2.languages.includes(l))
  if (sharedLanguages.length > 0) {
    strengths.push(`Gemeinsame Sprache: ${sharedLanguages.join(', ')}`)
  } else {
    concerns.push('Keine gemeinsame Sprache - Kommunikation schwierig')
    recommendations.push('Bildmaterial für Hausregeln bereitstellen')
  }

  // Smoking
  if (
    (r1.smokingStatus === 'INDOOR_SMOKER' && r2.smokingStatus === 'NON_SMOKER') ||
    (r2.smokingStatus === 'INDOOR_SMOKER' && r1.smokingStatus === 'NON_SMOKER')
  ) {
    concerns.push('Raucher/Nichtraucher Konfliktpotential')
    recommendations.push('Klare Raucherzonen definieren')
  }

  // Sleep
  if (
    (r1.sleepSchedule === 'EARLY_BIRD' && r2.sleepSchedule === 'NIGHT_OWL') ||
    (r2.sleepSchedule === 'EARLY_BIRD' && r1.sleepSchedule === 'NIGHT_OWL')
  ) {
    concerns.push('Sehr unterschiedliche Schlafzeiten')
    recommendations.push('Räume möglichst weit voneinander platzieren')
  }

  // Social style
  if (r1.socialStyle === r2.socialStyle) strengths.push('Ähnliche soziale Bedürfnisse')

  // Room sharing
  if (r1.roomSharingStatus === 'NEEDS_PRIVATE' || r2.roomSharingStatus === 'NEEDS_PRIVATE') {
    concerns.push('Einer/beide benötigen Einzelzimmer')
    recommendations.push('Nur in Einheit mit verfügbarem Einzelzimmer platzieren')
  }

  // Night disturbances
  if (
    (r1.hasNightDisturbances && r2.needsQuietEnvironment) ||
    (r2.hasNightDisturbances && r1.needsQuietEnvironment)
  ) {
    concerns.push('Nächtliche Unruhe trifft auf Ruhebedürfnis')
    recommendations.push('Nicht im selben Zimmer platzieren')
  }

  if (r1.needsQuietEnvironment && r2.needsQuietEnvironment) {
    strengths.push('Beide bevorzugen ruhige Umgebung')
  }

  // Risk-based check-ins
  if (scores.risk > 40) {
    recommendations.push('Regelmässige Check-ins in den ersten Wochen')
  }

  return { strengths, concerns, recommendations }
}
