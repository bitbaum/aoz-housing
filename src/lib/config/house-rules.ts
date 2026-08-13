/**
 * House Rules Configuration — SSOT
 *
 * Two tiers, one vocabulary:
 *   ORG  — AOZ-wide rules. The floor. Every unit is bound by them.
 *   UNIT — house rules the residents of one unit set for themselves.
 *
 * An ORG rule also declares HOW MUCH ROOM a unit has on that topic
 * (`delegation`). That is what makes the hierarchy real rather than two
 * unrelated lists: a unit rule always attaches to the AOZ rule it specialises,
 * and a unit can never legislate on a FIXED topic.
 *
 * The catalog below is the seed for the ORG tier. Once seeded, the DB is the
 * SSOT for rule *content* (staff edit it in the admin UI); this file stays the
 * SSOT for the *vocabulary* — categories, delegation semantics, labels.
 */
import { BRAND } from './brand'

import type { RuleCategory, RuleDelegation, RuleScope, RuleStatus } from '@prisma/client'

// =============================================================================
// SCOPE
// =============================================================================

export const RULE_SCOPE_LABELS: Record<RuleScope, string> = {
  ORG: `${BRAND.orgName}-Regel`,
  UNIT: 'Hausregel',
}

export const RULE_SCOPE_DESCRIPTIONS: Record<RuleScope, string> = {
  ORG: `Gilt in allen ${BRAND.orgName}-Unterkünften. Kann nicht vom Haus geändert werden.`,
  UNIT: 'Von den Bewohnenden dieses Hauses beschlossen.',
}

// =============================================================================
// DELEGATION — how much room a unit has on an AOZ topic
// =============================================================================

export const RULE_DELEGATION_LABELS: Record<RuleDelegation, string> = {
  FIXED: 'Nicht verhandelbar',
  UNIT_MAY_STRENGTHEN: 'Haus kann verschärfen',
  UNIT_DECIDES: 'Haus entscheidet',
}

export const RULE_DELEGATION_DESCRIPTIONS: Record<RuleDelegation, string> = {
  FIXED: 'Diese Regel gilt unverändert. Das Haus kann sie weder lockern noch ersetzen.',
  UNIT_MAY_STRENGTHEN:
    `Die ${BRAND.orgName}-Regel ist das Minimum. Das Haus kann strengere Regeln beschliessen, nie lockerere.`,
  UNIT_DECIDES:
    `Die ${BRAND.orgName} gibt nur das Thema vor. Wie es im Haus konkret gilt, beschliessen die Bewohnenden.`,
}

/** Units may only create their own rule under an AOZ topic that delegates. */
export const DELEGATION_ALLOWS_UNIT_RULE: Record<RuleDelegation, boolean> = {
  FIXED: false,
  UNIT_MAY_STRENGTHEN: true,
  UNIT_DECIDES: true,
}

/**
 * "Stricter, never looser" cannot be verified mechanically on free text — so we
 * do not pretend to. A UNIT_MAY_STRENGTHEN rule is routed to staff for an
 * explicit confirmation that it does not weaken the AOZ floor. UNIT_DECIDES
 * topics have no floor to undercut, so residents decide them alone.
 */
export const DELEGATION_REQUIRES_STAFF_CONFIRMATION: Record<RuleDelegation, boolean> = {
  FIXED: true,
  UNIT_MAY_STRENGTHEN: true,
  UNIT_DECIDES: false,
}

// =============================================================================
// CATEGORY
// =============================================================================

export const RULE_CATEGORY_LABELS: Record<RuleCategory, string> = {
  SAFETY: 'Sicherheit',
  RESPECT: 'Respekt',
  NOISE: 'Ruhe & Lärm',
  CLEANLINESS: 'Sauberkeit',
  KITCHEN: 'Küche',
  BATHROOM: 'Bad & WC',
  GUESTS: 'Besuch',
  SHARED_SPACES: 'Gemeinschaftsräume',
  COSTS: 'Kosten & Verbrauch',
  COMMUNICATION: 'Zusammenleben & Konflikte',
  OTHER: 'Sonstiges',
}

export const RULE_CATEGORY_ICONS: Record<RuleCategory, string> = {
  SAFETY: '🛟',
  RESPECT: '🤝',
  NOISE: '🔇',
  CLEANLINESS: '🧽',
  KITCHEN: '🍳',
  BATHROOM: '🚿',
  GUESTS: '👥',
  SHARED_SPACES: '🛋️',
  COSTS: '💡',
  COMMUNICATION: '💬',
  OTHER: '📋',
}

/** Display order — safety and respect first, housekeeping after. */
export const RULE_CATEGORY_ORDER: RuleCategory[] = [
  'SAFETY',
  'RESPECT',
  'COMMUNICATION',
  'NOISE',
  'CLEANLINESS',
  'KITCHEN',
  'BATHROOM',
  'GUESTS',
  'SHARED_SPACES',
  'COSTS',
  'OTHER',
]

export const RULE_STATUS_LABELS: Record<RuleStatus, string> = {
  ACTIVE: 'Gültig',
  SUPERSEDED: 'Ersetzt',
  ARCHIVED: 'Aufgehoben',
}

export const RULE_STATUS_COLORS: Record<RuleStatus, string> = {
  ACTIVE: 'bg-status-success/15 text-status-success-text',
  SUPERSEDED: 'bg-ui-subtle text-ui-muted',
  ARCHIVED: 'bg-ui-subtle text-ui-muted',
}

// =============================================================================
// AOZ BASELINE CATALOG (seed for the ORG tier)
// =============================================================================

export interface OrgRuleSeed {
  /** Stable identifier — code and tests reference rules by key, never by text. */
  key: string
  category: RuleCategory
  title: string
  body: string
  delegation: RuleDelegation
}

/**
 * The AOZ floor. Two kinds of entry:
 *  - FIXED rules state an obligation directly.
 *  - Delegating rules name a topic and hand the concrete norm to the house.
 *    They read as an invitation, because that is what they are.
 */
export const ORG_RULE_CATALOG: readonly OrgRuleSeed[] = [
  {
    key: 'no_violence',
    category: 'SAFETY',
    title: 'Keine Gewalt und keine Drohungen',
    body:
      `Körperliche Gewalt, Drohungen, Einschüchterung und sexuelle Belästigung sind in allen ${BRAND.orgName}-Unterkünften verboten. Bei akuter Gefahr: sofort die Betreuung oder die Polizei (117) rufen.`,
    delegation: 'FIXED',
  },
  {
    key: 'respect_dignity',
    category: 'RESPECT',
    title: 'Respekt vor allen Menschen im Haus',
    body:
      'Alle im Haus werden mit Respekt behandelt — unabhängig von Herkunft, Sprache, Religion, Geschlecht, sexueller Orientierung, Alter oder Gesundheit. Beleidigungen und Ausgrenzung sind nicht erlaubt.',
    delegation: 'FIXED',
  },
  {
    key: 'privacy_rooms',
    category: 'RESPECT',
    title: 'Privatsphäre der anderen achten',
    body:
      'Zimmer und persönliche Sachen anderer nur mit deren Einverständnis betreten oder benutzen. Das gilt auch im geteilten Zimmer.',
    delegation: 'FIXED',
  },
  {
    key: 'conflict_first_step',
    category: 'COMMUNICATION',
    title: 'Konflikte früh und direkt ansprechen',
    body:
      'Wer sich gestört fühlt, spricht es zuerst ruhig und direkt an — je früher, desto einfacher. Kommt ihr nicht weiter, hilft die Betreuung bei der Vermittlung. Niemand muss einen Konflikt allein lösen, und niemand hat Nachteile, weil er oder sie Hilfe holt.',
    delegation: 'FIXED',
  },
  {
    key: 'fire_safety',
    category: 'SAFETY',
    title: 'Brandschutz',
    body:
      'Fluchtwege, Treppenhäuser und Kellergänge bleiben frei. Keine Kerzen, offenen Flammen, Shisha-Kohlen oder eigenen Heizgeräte in den Zimmern. Rauchmelder nie abdecken oder entfernen.',
    delegation: 'FIXED',
  },
  {
    key: 'smoking_indoors',
    category: 'SAFETY',
    title: 'Rauchverbot in den Innenräumen',
    body:
      'In Zimmern, Küchen, Bädern, Fluren und allen anderen Innenräumen wird nicht geraucht — auch nicht am Fenster. Das gilt auch für E-Zigaretten.',
    delegation: 'FIXED',
  },
  {
    key: 'smoking_areas',
    category: 'SHARED_SPACES',
    title: 'Wo im Haus geraucht wird',
    body:
      'Wo genau draussen geraucht wird und wie die Aschenbecher geleert werden, legt das Haus selbst fest.',
    delegation: 'UNIT_DECIDES',
  },
  {
    key: 'no_illegal_substances',
    category: 'SAFETY',
    title: 'Keine illegalen Substanzen',
    body:
      'Herstellung, Handel und Konsum illegaler Substanzen sind in der Unterkunft verboten. Wer Unterstützung bei einer Sucht möchte, kann sich vertraulich an die Betreuung wenden.',
    delegation: 'FIXED',
  },
  {
    key: 'weapons',
    category: 'SAFETY',
    title: 'Keine Waffen',
    body:
      'Waffen und waffenähnliche Gegenstände dürfen nicht in die Unterkunft gebracht werden.',
    delegation: 'FIXED',
  },
  {
    key: 'damage_reporting',
    category: 'COMMUNICATION',
    title: 'Schäden und Defekte sofort melden',
    body:
      'Defekte, Wasserschäden, Ungeziefer und kaputte Geräte werden sofort gemeldet — über die App oder bei der Betreuung. Wer einen Schaden meldet, wird nicht dafür bestraft.',
    delegation: 'FIXED',
  },
  {
    key: 'pets',
    category: 'SHARED_SPACES',
    title: 'Haustiere nur mit Bewilligung',
    body: `Tiere dürfen nur mit schriftlicher Bewilligung der ${BRAND.orgName} gehalten werden.`,
    delegation: 'FIXED',
  },
  {
    key: 'night_quiet',
    category: 'NOISE',
    title: 'Nachtruhe ab 22:00 Uhr',
    body:
      'Von 22:00 bis 07:00 Uhr ist es im ganzen Haus ruhig: kein lautes Musikhören, Telefonieren oder Fernsehen ohne Kopfhörer, keine lauten Gespräche in Fluren und Küchen. Das Haus kann zusätzliche Ruhezeiten beschliessen (zum Beispiel mittags), aber keine kürzeren.',
    delegation: 'UNIT_MAY_STRENGTHEN',
  },
  {
    key: 'guests_registration',
    category: 'GUESTS',
    title: 'Besuch bis 22:00 Uhr, Übernachtung nur mit Bewilligung',
    body:
      'Besuch ist bis 22:00 Uhr willkommen. Übernachtungen brauchen vorher eine Bewilligung der Betreuung. Wer Besuch empfängt, ist für das Verhalten des Besuchs im Haus verantwortlich. Das Haus kann engere Regeln beschliessen (zum Beispiel Besuch nur in Gemeinschaftsräumen).',
    delegation: 'UNIT_MAY_STRENGTHEN',
  },
  {
    key: 'shared_cleaning',
    category: 'CLEANLINESS',
    title: 'Gemeinschaftsräume gemeinsam sauber halten',
    body:
      'Küche, Bad, WC, Flure und Aufenthaltsräume werden von allen gemeinsam sauber gehalten. Wie ihr das organisiert — Putzplan, Turnus, Aufteilung — beschliesst das Haus selbst.',
    delegation: 'UNIT_DECIDES',
  },
  {
    key: 'kitchen_use',
    category: 'KITCHEN',
    title: 'Küche',
    body:
      'Nach dem Kochen wird aufgeräumt und abgewaschen. Alles Weitere — Kochzeiten, Kühlschrankfächer, gemeinsame Vorräte, Umgang mit stehengelassenem Geschirr — beschliesst das Haus.',
    delegation: 'UNIT_DECIDES',
  },
  {
    key: 'bathroom_use',
    category: 'BATHROOM',
    title: 'Bad und WC',
    body:
      'Das Bad wird sauber hinterlassen. Duschzeiten am Morgen, Reinigungsturnus und Ablage von persönlichen Sachen beschliesst das Haus.',
    delegation: 'UNIT_DECIDES',
  },
  {
    key: 'shared_spaces_use',
    category: 'SHARED_SPACES',
    title: 'Gemeinschaftsräume',
    body:
      'Wie die Aufenthaltsräume genutzt werden — Fernsehzeiten, Kinderbereich, Waschmaschinen-Turnus — beschliesst das Haus.',
    delegation: 'UNIT_DECIDES',
  },
  {
    key: 'energy_costs',
    category: 'COSTS',
    title: 'Sorgsam mit Energie und Wasser umgehen',
    body:
      'Licht, Heizung und Wasser werden sparsam genutzt; Fenster beim Heizen nicht dauerhaft offen lassen. Das Haus kann konkretere Abmachungen treffen.',
    delegation: 'UNIT_MAY_STRENGTHEN',
  },
] as const

/** Keys are the stable identity of an AOZ rule — they must be unique. */
export const ORG_RULE_KEYS = ORG_RULE_CATALOG.map((r) => r.key)

/** Topics a house can actually legislate on — drives the "propose a rule" UI. */
export const DELEGATED_ORG_RULE_KEYS = ORG_RULE_CATALOG.filter(
  (r) => DELEGATION_ALLOWS_UNIT_RULE[r.delegation]
).map((r) => r.key)
