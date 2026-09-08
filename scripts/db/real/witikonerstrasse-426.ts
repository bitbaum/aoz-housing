/**
 * Witikonerstrasse 426 — two flats of REAL AOZ stock, seeded with CLAIMABLE
 * placeholder profiles.
 *
 * ## What is real here and what is not
 *
 * The building, the address and the unit codes are real: `WIT-426-01` and
 * `WIT-426-03` were already rows in the production database, imported with the
 * rest of AOZ's stock and sitting CLOSED with zero beds. This config activates
 * two of them. Nothing invents an address.
 *
 * The PEOPLE are placeholders. Each is a profile with a plausible first name
 * and a real login code, marked `isPlaceholder`, existing so that the person
 * who actually moves in can TAKE IT OVER — register at /register with that
 * code and the profile becomes theirs, exactly as a staff member claims the
 * code minted for them before they started.
 *
 * ## Three rules these follow
 *
 * 1. **First names only.** Same as the real flat's config. A surname is a
 *    stronger claim about a person than a placeholder is entitled to make, and
 *    the product's own privacy default is that the code is the identity and a
 *    name is something the resident chooses to add.
 *
 * 2. **Neutral factor defaults, always.** Not one preference below is a
 *    statement about anybody. Inventing that a placeholder is a light sleeper
 *    who dislikes guests would put fiction into the compatibility algorithm and
 *    out the other side as a recommendation staff might act on.
 *
 * 3. **A free bed is left in 426-03.** A flat seeded to exactly full can never
 *    demonstrate the thing this product is for — placing someone. The vacancy
 *    is deliberate, not an off-by-one.
 *
 * Codes are generated at seed time and printed once. They are NOT in this file:
 * a placeholder's code is still a credential, and whoever holds it takes the
 * profile over.
 */

import type { RealResidentSeed, RealRoomSeed } from './witikonerstrasse-458'

export interface PlaceholderApartment {
  unit: {
    code: string
    address: string
    totalBeds: number
    totalRooms: number
    sharedRooms: number
    privateRooms: number
    sharedBathrooms: number
    privateBathrooms: number
    sharedKitchen: boolean
    privateKitchen: boolean
  }
  rooms: RealRoomSeed[]
  residents: RealResidentSeed[]
  /**
   * Marks every resident below as a claimable placeholder rather than a real
   * client. Drives `Resident.isPlaceholder`, which keeps these rows out of
   * every pilot KPI until a real person claims the code.
   */
  placeholder: true
}

export const WIT_426_01: PlaceholderApartment = {
  unit: {
    code: 'WIT-426-01',
    address: 'Witikonerstrasse 426, 8053 Zürich',
    totalBeds: 3,
    totalRooms: 2,
    sharedRooms: 1,
    privateRooms: 1,
    sharedBathrooms: 1,
    privateBathrooms: 0,
    sharedKitchen: true,
    privateKitchen: false,
  },
  rooms: [
    { code: 'R1', label: 'Zimmer 1', beds: 1 },
    { code: 'R2', label: 'Zimmer 2', beds: 2 },
  ] satisfies RealRoomSeed[],
  residents: [
    { displayName: 'Amir', room: 'R1' },
    { displayName: 'Yusuf', room: 'R2' },
    { displayName: 'Tesfay', room: 'R2' },
  ] satisfies RealResidentSeed[],
  placeholder: true,
}

export const WIT_426_03: PlaceholderApartment = {
  unit: {
    code: 'WIT-426-03',
    address: 'Witikonerstrasse 426, 8053 Zürich',
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
  // Four people in five beds. The empty bed in R3 is the point — see rule 3.
  residents: [
    { displayName: 'Nour', room: 'R1' },
    { displayName: 'Samira', room: 'R2' },
    { displayName: 'Leyla', room: 'R2' },
    { displayName: 'Dawit', room: 'R3' },
  ] satisfies RealResidentSeed[],
  placeholder: true,
}

export const PLACEHOLDER_APARTMENTS: PlaceholderApartment[] = [WIT_426_01, WIT_426_03]
