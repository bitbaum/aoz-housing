/**
 * Real apartment: Witikonerstrasse 458 — data config for prisma/seed-real.ts.
 *
 * SSOT for the physical layout and who lives where. Login codes are NOT in
 * this file on purpose: they are generated at seed time and printed once —
 * committing codes to a repository would publish everyone's login.
 *
 * Residents get neutral factor defaults; everyone refines their own
 * preferences (and name, photo, bio) in the portal afterwards.
 */

export interface RealRoomSeed {
  code: string
  label: string
  beds: number
}

export interface RealResidentSeed {
  displayName: string
  /** Room code from `rooms` this person sleeps in. */
  room: string
}

export const REAL_APARTMENT = {
  unit: {
    code: 'WIT-458',
    address: 'Witikonerstrasse 458, 8053 Zürich',
    totalBeds: 5,
    totalRooms: 3,
    sharedRooms: 2,
    privateRooms: 1,
    sharedBathrooms: 1,
    privateBathrooms: 0,
    sharedKitchen: true,
    privateKitchen: false,
  },
  rooms: [
    { code: 'R1', label: 'Zimmer 1', beds: 1 },
    { code: 'R2', label: 'Zimmer 2', beds: 2 },
    { code: 'R3', label: 'Zimmer 3', beds: 2 },
  ] satisfies RealRoomSeed[],
  residents: [
    { displayName: 'Georgy', room: 'R1' },
    { displayName: 'Ihor', room: 'R2' },
    { displayName: 'Misha', room: 'R3' },
    { displayName: 'Alex', room: 'R3' },
  ] satisfies RealResidentSeed[],
}
