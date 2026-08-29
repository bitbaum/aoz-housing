/**
 * Room-level fit — the conflict surface in AOZ housing is the Zimmer,
 * not the Wohnung average.
 *
 * A 12 m² room with three beds is where sleep, noise and smoking actually
 * collide. Scoring the whole apartment hid that: two compatible people in
 * room 1 made a third look fine for room 2 even when the one remaining
 * roommate was a blocking mismatch.
 */

import type { PlacementSpot, Resident } from '@prisma/client'
import { calculateCompatibility } from './scoring'
import { toResidentProfile } from './convert'

export interface OccupiedSpot {
  id: string
  type: PlacementSpot['type']
  parentSpotId: string | null
  code: string
  status: PlacementSpot['status']
  placements: { resident: Resident }[]
}

export interface RoomFit {
  spotId: string
  spotCode: string
  roommateCount: number
  /** Worst pairwise score in this Zimmer. Empty room → null (not 100). */
  score: number | null
  blocking: boolean
  roommateCodes: string[]
}

/**
 * People who would share this Zimmer if the new resident took `spot`.
 * Beds in the same parent room; a private room or studio has none.
 */
export function roommatesForSpot(
  spot: OccupiedSpot,
  allSpots: OccupiedSpot[],
  excludeResidentId?: string,
): Resident[] {
  if (spot.type === 'PRIVATE_ROOM' || spot.type === 'STUDIO' || spot.type === 'ROOM') {
    return []
  }

  const siblings = spot.parentSpotId
    ? allSpots.filter(
        (s) => s.parentSpotId === spot.parentSpotId && s.id !== spot.id && s.type === 'BED',
      )
    : []

  return siblings.flatMap((s) =>
    s.placements.map((p) => p.resident).filter((r) => r.id !== excludeResidentId),
  )
}

export function scoreRoomFit(
  newResident: Resident,
  spot: OccupiedSpot,
  allSpots: OccupiedSpot[],
): RoomFit {
  const roommates = roommatesForSpot(spot, allSpots, newResident.id)
  if (roommates.length === 0) {
    return {
      spotId: spot.id,
      spotCode: spot.code,
      roommateCount: 0,
      score: null,
      blocking: false,
      roommateCodes: [],
    }
  }

  const incoming = toResidentProfile(newResident)
  const pairwise = roommates.map((roommate) =>
    calculateCompatibility(incoming, toResidentProfile(roommate)),
  )
  const worst = pairwise.reduce((min, s) => (s.overall < min.overall ? s : min))

  return {
    spotId: spot.id,
    spotCode: spot.code,
    roommateCount: roommates.length,
    score: worst.overall,
    blocking: worst.overall < 20 || (worst.concerns?.some((c) => /block/i.test(c)) ?? false),
    roommateCodes: roommates.map((r) => r.code),
  }
}

/**
 * Best available bed in the unit, scored against the people who share
 * that Zimmer. Empty rooms sort below a good roommate match but above a
 * blocking one — vacancy is not 100% compatibility.
 */
export function bestRoomFit(newResident: Resident, spots: OccupiedSpot[]): RoomFit | null {
  const assignable = spots.filter((s) => s.status === 'AVAILABLE' && s.type !== 'ROOM')
  if (assignable.length === 0) return null

  const fits = assignable.map((spot) => scoreRoomFit(newResident, spot, spots))
  return fits.reduce((best, fit) => {
    const bestScore = best.score ?? 55
    const fitScore = fit.score ?? 55
    if (fit.blocking !== best.blocking) return fit.blocking ? best : fit
    return fitScore > bestScore ? fit : best
  })
}
