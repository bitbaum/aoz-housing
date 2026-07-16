/**
 * Tests for roommate-preferences serialization (portal preferences round-trip)
 */

import {
  serializeRoommatePreferences,
  parseRoommatePreferences,
} from '../roommate-preferences'

describe('serializeRoommatePreferences', () => {
  test('returns null when all parts are empty', () => {
    expect(serializeRoommatePreferences({})).toBeNull()
    expect(
      serializeRoommatePreferences({
        preferredAgeRange: '',
        culturalPreference: '',
        additionalPreferences: '   ',
      })
    ).toBeNull()
  })

  test('serializes known codes as human-readable German labels', () => {
    const text = serializeRoommatePreferences({
      preferredAgeRange: 'SIMILAR',
      culturalPreference: 'SAME_REGION',
      additionalPreferences: 'Ich arbeite Nachtschicht',
    })

    expect(text).toBe(
      'Altersgruppe: Ähnliches Alter wie ich\n' +
        'Kultur: Aus meiner Region\n' +
        'Wünsche: Ich arbeite Nachtschicht'
    )
  })

  test('serializes age-range factor codes with their German labels', () => {
    const text = serializeRoommatePreferences({ preferredAgeRange: 'YOUNG_ADULT' })
    expect(text).toBe('Altersgruppe: 18-25 Jahre')
  })

  test('serializes unknown values verbatim so nothing is lost', () => {
    const text = serializeRoommatePreferences({
      preferredAgeRange: '25-35',
      culturalPreference: 'Arabisch',
    })
    expect(text).toBe('Altersgruppe: 25-35\nKultur: Arabisch')
  })

  test('omits empty parts', () => {
    expect(serializeRoommatePreferences({ additionalPreferences: 'Nur Wünsche' })).toBe(
      'Wünsche: Nur Wünsche'
    )
  })
})

describe('parseRoommatePreferences', () => {
  test('returns empty parts for null / empty input', () => {
    const empty = { preferredAgeRange: '', culturalPreference: '', additionalPreferences: '' }
    expect(parseRoommatePreferences(null)).toEqual(empty)
    expect(parseRoommatePreferences(undefined)).toEqual(empty)
    expect(parseRoommatePreferences('')).toEqual(empty)
  })

  test('parses German labels back to form values', () => {
    const parts = parseRoommatePreferences(
      'Altersgruppe: Ähnliches Alter wie ich\nKultur: Aus anderen Regionen (zum Kennenlernen)\nWünsche: Keine Katzen'
    )
    expect(parts).toEqual({
      preferredAgeRange: 'SIMILAR',
      culturalPreference: 'DIFFERENT_REGION',
      additionalPreferences: 'Keine Katzen',
    })
  })

  test('accepts legacy raw code values', () => {
    const parts = parseRoommatePreferences('Altersgruppe: SENIOR\nKultur: SAME_REGION')
    expect(parts.preferredAgeRange).toBe('SENIOR')
    expect(parts.culturalPreference).toBe('SAME_REGION')
  })

  test('puts legacy free-form content into additionalPreferences instead of dropping it', () => {
    // Legacy format joined parts with '. ' on a single line
    const legacy = 'Altersgruppe: 25-35. Kultur: Arabisch. Ruhige Person'
    const parts = parseRoommatePreferences(legacy)
    expect(parts.preferredAgeRange).toBe('')
    expect(parts.culturalPreference).toBe('')
    expect(parts.additionalPreferences).toBe(legacy)
  })

  test('keeps unrecognized lines in additionalPreferences', () => {
    const parts = parseRoommatePreferences(
      'Altersgruppe: 18-25 Jahre\nBitte niemand der raucht'
    )
    expect(parts.preferredAgeRange).toBe('YOUNG_ADULT')
    expect(parts.additionalPreferences).toBe('Bitte niemand der raucht')
  })
})

describe('round-trip', () => {
  test('serialize → parse restores all three form values', () => {
    const input = {
      preferredAgeRange: 'MIDDLE_AGED',
      culturalPreference: 'DIFFERENT_REGION',
      additionalPreferences: 'Ich habe Allergien gegen Katzen',
    }
    expect(parseRoommatePreferences(serializeRoommatePreferences(input))).toEqual(input)
  })

  test('round-trips multiline additional preferences', () => {
    const input = {
      preferredAgeRange: 'SIMILAR',
      culturalPreference: 'SAME_REGION',
      additionalPreferences: 'Ich arbeite Nachtschicht.\nBitte ruhige Mitbewohner.',
    }
    expect(parseRoommatePreferences(serializeRoommatePreferences(input))).toEqual(input)
  })

  test('round-trips when only some fields are set', () => {
    const input = {
      preferredAgeRange: '',
      culturalPreference: 'SAME_REGION',
      additionalPreferences: '',
    }
    expect(parseRoommatePreferences(serializeRoommatePreferences(input))).toEqual(input)
  })
})

describe('legacy single-line format (pre-labeled, ". "-joined raw codes)', () => {
  test('recovers structured fields and free text from a full legacy line', () => {
    expect(
      parseRoommatePreferences('Altersgruppe: SIMILAR. Kultur: SAME_REGION. Ich arbeite Nachtschicht')
    ).toEqual({
      preferredAgeRange: 'SIMILAR',
      culturalPreference: 'SAME_REGION',
      additionalPreferences: 'Ich arbeite Nachtschicht',
    })
  })

  test('recovers a legacy line with only age and free text', () => {
    expect(parseRoommatePreferences('Altersgruppe: YOUNG_ADULT. Bitte ruhig')).toEqual({
      preferredAgeRange: 'YOUNG_ADULT',
      culturalPreference: '',
      additionalPreferences: 'Bitte ruhig',
    })
  })

  test('recovers a legacy line with only structured fields', () => {
    expect(parseRoommatePreferences('Altersgruppe: SIMILAR. Kultur: DIFFERENT_REGION')).toEqual({
      preferredAgeRange: 'SIMILAR',
      culturalPreference: 'DIFFERENT_REGION',
      additionalPreferences: '',
    })
  })
})

describe('free-text continuation safety', () => {
  test('wishes lines that look like structured lines are not promoted', () => {
    const input = {
      preferredAgeRange: '',
      culturalPreference: '',
      additionalPreferences: 'Meine Notizen:\nKultur: Aus meiner Region\nAltersgruppe: Ähnliches Alter wie ich',
    }
    expect(parseRoommatePreferences(serializeRoommatePreferences(input))).toEqual(input)
  })

  test('structured fields before wishes still parse, lookalikes after wishes stay free text', () => {
    const input = {
      preferredAgeRange: 'SIMILAR',
      culturalPreference: '',
      additionalPreferences: 'Erste Zeile\nKultur: Aus meiner Region',
    }
    expect(parseRoommatePreferences(serializeRoommatePreferences(input))).toEqual(input)
  })
})
