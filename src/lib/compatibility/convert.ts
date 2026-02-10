/**
 * Convert Prisma Resident to ResidentProfile for scoring
 */

import type { Resident } from '@prisma/client'
import type { ResidentProfile } from './types'

/**
 * Convert a Prisma Resident record to a ResidentProfile for compatibility scoring
 */
export function toResidentProfile(resident: Resident): ResidentProfile {
  return {
    id: resident.id,
    code: resident.code,
    ageRange: resident.ageRange,
    gender: resident.gender,
    familyStatus: resident.familyStatus,
    sleepSchedule: resident.sleepSchedule,
    noiseTolerance: resident.noiseTolerance,
    cleanlinessLevel: resident.cleanlinessLevel,
    guestTolerance: resident.guestTolerance,
    socialStyle: resident.socialStyle,
    languages: resident.languages,
    culturalRegion: resident.culturalRegion ?? undefined,
    conflictStyle: resident.conflictStyle,
    smokingStatus: resident.smokingStatus,
    dietaryNeeds: resident.dietaryNeeds,
    mobilityNeeds: resident.mobilityNeeds,
    medicalEquipment: resident.medicalEquipment,
    petTolerance: resident.petTolerance,
    sharedBathroom: resident.sharedBathroom,
    sharedKitchen: resident.sharedKitchen,
    privacyNeed: resident.privacyNeed,
    choresContribution: resident.choresContribution,
    recyclingKnowledge: resident.recyclingKnowledge,
    roomSharingStatus: resident.roomSharingStatus,
    hasNightDisturbances: resident.hasNightDisturbances,
    needsQuietEnvironment: resident.needsQuietEnvironment,
    hasSleepEquipment: resident.hasSleepEquipment,
    supportLevel: resident.supportLevel,
  }
}
