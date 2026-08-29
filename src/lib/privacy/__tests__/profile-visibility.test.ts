import {
  canSeeProfile,
  redactProfile,
  PROFILE_VISIBILITY_OPTIONS,
  type ProfileViewer,
} from '@/lib/privacy/profile-visibility'
import type { ProfileVisibility } from '@prisma/client'

/**
 * The failure this suite exists to prevent is not a crash. It is a photo shown
 * to somebody the resident had specifically hidden it from — which nobody finds
 * in review, and which the person it happened to finds first.
 */

const subject = (profileVisibility: ProfileVisibility) => ({ id: 'r-subject', profileVisibility })

const roommate: ProfileViewer = { kind: 'resident', residentId: 'r-other', sharesUnit: true }
const stranger: ProfileViewer = { kind: 'resident', residentId: 'r-far', sharesUnit: false }
const staff: ProfileViewer = { kind: 'staff' }
const anonymous: ProfileViewer = { kind: 'anonymous' }

describe('who may see a profile', () => {
  it('never shows anything to someone signed out', () => {
    for (const visibility of PROFILE_VISIBILITY_OPTIONS) {
      expect({ visibility, seen: canSeeProfile(anonymous, subject(visibility)) }).toEqual({
        visibility,
        seen: false,
      })
    }
  })

  it('always shows staff, whatever the resident chose', () => {
    // A deliberate decision: a caseworker who cannot put a face or a chosen
    // name to the person they support is worse at supporting them, and they
    // already hold far more sensitive data than a self-written bio.
    for (const visibility of PROFILE_VISIBILITY_OPTIONS) {
      expect({ visibility, seen: canSeeProfile(staff, subject(visibility)) }).toEqual({
        visibility,
        seen: true,
      })
    }
  })

  it('always shows you your own profile, even when set to PRIVATE', () => {
    // Otherwise choosing PRIVATE would hide your own page from you.
    const self: ProfileViewer = { kind: 'resident', residentId: 'r-subject', sharesUnit: false }
    expect(canSeeProfile(self, subject('PRIVATE'))).toBe(true)
  })

  describe('PRIVATE', () => {
    it('hides from roommates and from everyone else', () => {
      expect(canSeeProfile(roommate, subject('PRIVATE'))).toBe(false)
      expect(canSeeProfile(stranger, subject('PRIVATE'))).toBe(false)
    })
  })

  describe('ROOMMATES', () => {
    it('shows the people you live with', () => {
      expect(canSeeProfile(roommate, subject('ROOMMATES'))).toBe(true)
    })

    it('hides residents of other units', () => {
      // This is the setting's whole point, and it is the behaviour the photo
      // endpoint already had — so migrating to it widens nobody's exposure.
      expect(canSeeProfile(stranger, subject('ROOMMATES'))).toBe(false)
    })
  })

  describe('RESIDENTS', () => {
    it('shows every resident', () => {
      expect(canSeeProfile(stranger, subject('RESIDENTS'))).toBe(true)
      expect(canSeeProfile(roommate, subject('RESIDENTS'))).toBe(true)
    })
  })

  it('withholds when the setting is not one it knows', () => {
    // A value from a schema change nobody finished. The safe direction for a
    // privacy default is always "show less" — defaulting to visible would turn
    // an incomplete migration into a disclosure.
    const broken = { id: 'r-subject', profileVisibility: 'SOMETHING_NEW' as ProfileVisibility }
    expect(canSeeProfile(roommate, broken)).toBe(false)
    expect(canSeeProfile(stranger, broken)).toBe(false)
  })

  it('still lets staff through on an unknown setting', () => {
    // Staff access does not depend on parsing the resident's choice, so an
    // unfinished migration cannot lock caseworkers out of their own tool.
    const broken = { id: 'r-subject', profileVisibility: 'SOMETHING_NEW' as ProfileVisibility }
    expect(canSeeProfile(staff, broken)).toBe(true)
  })
})

describe('redacting a row', () => {
  const row = {
    id: 'r-subject',
    code: 'RES-ABC123',
    displayName: 'Fatima',
    bio: 'Ich koche gern.',
    photoVersion: new Date('2026-08-01'),
    profileVisibility: 'PRIVATE' as ProfileVisibility,
  }

  it('removes the name, the bio and the photo together', () => {
    // Together, because enforcing this only at the photo endpoint would hide
    // the picture and print the bio directly underneath it.
    const seen = redactProfile(row, roommate)

    expect(seen.displayName).toBeNull()
    expect(seen.bio).toBeNull()
    expect(seen.photoVersion).toBeNull()
  })

  it('keeps the code, so the card still identifies somebody', () => {
    // The code is the identifier the product runs on and everyone in a shared
    // flat already knows it. Blanking it would leave a card naming nobody.
    expect(redactProfile(row, roommate).code).toBe('RES-ABC123')
  })

  it('leaves the row untouched for someone allowed to see it', () => {
    expect(redactProfile({ ...row, profileVisibility: 'ROOMMATES' }, roommate).displayName).toBe(
      'Fatima',
    )
  })

  it('leaves the row untouched for staff', () => {
    expect(redactProfile(row, staff).bio).toBe('Ich koche gern.')
  })

  it('does not invent fields the row never had', () => {
    // Adding `bio: null` to a row that carries no bio would break the shape a
    // caller's `select` promised.
    const slim = {
      id: 'r-subject',
      displayName: 'Fatima',
      profileVisibility: 'PRIVATE' as ProfileVisibility,
    }
    expect('bio' in redactProfile(slim, roommate)).toBe(false)
  })
})
