import {
  DELEGATION_ALLOWS_UNIT_RULE,
  ORG_RULE_CATALOG,
  ORG_RULE_KEYS,
} from '../house-rules'

describe('ORG_RULE_CATALOG', () => {
  it('has unique keys — keys are the stable identity the sync is keyed on', () => {
    expect(new Set(ORG_RULE_KEYS).size).toBe(ORG_RULE_KEYS.length)
  })

  it('covers every topic of the signed AOZ Hausordnung', () => {
    // One key per section of the signed paper document (Stand Januar 2026).
    // If one of these disappears, residents are held to a paper rule the app
    // no longer shows them.
    const hausordnungKeys = [
      'night_quiet', // Ruhezeiten (incl. Mittagsruhe, Sonn-/Feiertage)
      'guests_registration', // Besucher*innen
      'room_care', // Sauberkeit und Ordnung (tägliches Lüften)
      'shared_cleaning', // Gemeinschaftsräume, Korridore, Umgebung
      'waste_recycling', // Abfälle und Recycling (Züri-Säcke, ERZ)
      'care_of_property', // Ausbau, Einrichtung und Geräte
      'fire_safety', // Sicherheit und Feuerschutz
      'cooking_supervision', // Kochherd nur bei Anwesenheit
      'keys_and_doors', // Schlüssel, Eingangstüren
      'pets', // Haustiere
      'damage_reporting', // Konflikte, Mängel und Schäden
      'access_appointments', // Zutrittsregelung
      'reachability', // Erreichbarkeit
    ]
    for (const key of hausordnungKeys) {
      expect(ORG_RULE_KEYS).toContain(key)
    }
  })

  it('keeps the non-negotiable paper rules FIXED — a house cannot vote them away', () => {
    // These come from the signed document with no room for house variation.
    const fixed = ['pets', 'keys_and_doors', 'cooking_supervision', 'waste_recycling', 'reachability']
    for (const key of fixed) {
      const rule = ORG_RULE_CATALOG.find((r) => r.key === key)!
      expect(rule.delegation).toBe('FIXED')
      expect(DELEGATION_ALLOWS_UNIT_RULE[rule.delegation]).toBe(false)
    }
  })

  it('states the actual quiet and visiting hours from the signed document', () => {
    const quiet = ORG_RULE_CATALOG.find((r) => r.key === 'night_quiet')!
    expect(quiet.body).toContain('22:00 bis 07:00')
    expect(quiet.body).toContain('12:00 bis 13:00')

    const guests = ORG_RULE_CATALOG.find((r) => r.key === 'guests_registration')!
    expect(guests.body).toContain('08:00 bis 22:00')
    // The signed rule allows NO overnight guests — softening this in the app
    // would show residents a rule the organization does not actually grant.
    expect(guests.body).toContain('nicht übernachten')
  })
})
