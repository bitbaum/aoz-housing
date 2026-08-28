/**
 * Opportunities admin labels (German, Swiss spelling).
 *
 * Enum labels live in `lib/config/opportunities.ts` — this file is page copy
 * only, so a status never gets a second wording here.
 */

import { OPPORTUNITY_AREA_NAME } from '@/lib/config/opportunities'

export const OPPORTUNITIES_ADMIN_LABELS = {
  pageTitle: OPPORTUNITY_AREA_NAME,
  // Names all four kinds. It listed only the two unpaid ones, which was
  // accurate until work became something this board can hold — the same shape
  // as a nav group keeping its name after its contents changed.
  pageDescription:
    'Arbeitsstellen, Praktika, Freiwilligenarbeit und gemeinnützige Einsätze — wo es Plätze gibt und wer gerade wohin unterwegs ist.',
  newAction: 'Einsatzplatz',
  createTitle: 'Einsatzplatz erfassen',
  createDescription:
    'Neue Plätze bleiben Entwurf, bis sie veröffentlicht werden. Was der Platz voraussetzt, gehört zum Platz — nicht zur Person.',
  editTitle: 'Einsatzplatz bearbeiten',
  detailBack: 'Alle Einsatzplätze',

  statTotal: 'Plätze',
  statPublished: 'Veröffentlicht',
  statDrafts: 'Entwürfe',
  statActivePeople: 'Laufende Einsätze',
  statOpenThreads: 'Offene Bewerbungen',

  filterAll: 'Alle',
  filterKind: 'Art',
  filterStatus: 'Stand',
  filterSearch: 'Suche',
  filterSearchPlaceholder: 'Titel, Organisation oder Ort…',
  filterReset: 'Filter zurücksetzen',
  apply: 'Anwenden',

  emptyTitle: 'Noch keine Einsatzplätze erfasst.',
  emptyBody:
    'Trag den ersten Platz ein — eine Organisation, ein Ort, ein paar Stunden pro Woche. Danach kannst du Klient*innen zuordnen und siehst, wo alle stehen.',
  emptyAction: 'Ersten Einsatzplatz erfassen',
  noResults: 'Keine passenden Einsatzplätze.',

  // Listing detail
  sectionDetails: 'Der Platz',
  sectionRequirements: 'Voraussetzungen',
  sectionContact: 'Kontakt',
  sectionApplicants: 'Wer ist unterwegs',
  requirementsHint:
    'Diese Angaben beschreiben den Platz. Wir speichern keinen Aufenthaltsstatus — die Zuordnung machst du, weil du den Fall kennst.',
  germanLevel: 'Deutsch (GER)',
  germanLevelAny: 'Kein Niveau vorausgesetzt',
  permitRequirement: 'Bewilligung',
  permitRequirementWorkHint:
    'Bei Arbeitsstellen und Praktika muss ein Bewilligungsweg angegeben sein — ' +
    '«keine Bewilligung nötig» ist dort keine gültige Angabe. Solange das offen ' +
    'ist, als Entwurf speichern.',
  requirementNote: 'Hinweis zu den Voraussetzungen',
  organisation: 'Organisation',
  location: 'Ort',
  schedule: 'Zeiten',
  hoursPerWeek: 'Stunden pro Woche',
  seats: 'Plätze',
  seatsFree: 'frei',
  seatsUnknown: 'Anzahl offen',
  seatsFull: 'Besetzt',
  peopleUnderway: 'unterwegs',
  open: 'Öffnen',
  startsAt: 'Start',
  endsAt: 'Ende',
  contactName: 'Ansprechperson',
  contactEmail: 'E-Mail',
  contactPhone: 'Telefon',
  website: 'Webseite',
  titleField: 'Titel',
  titlePlaceholder: 'z.B. Mittagstisch im Quartiertreff',
  descriptionField: 'Beschreibung',
  kindField: 'Art',
  statusField: 'Stand',

  // Applicants
  addApplicant: 'Person zuordnen',
  addApplicantHint: 'Wer hat Interesse an diesem Platz?',
  addApplicantEmpty: 'Alle betreuten Personen sind diesem Platz bereits zugeordnet.',
  applicantsEmpty: 'Noch niemand zugeordnet.',
  applicantNote: 'Notiz',
  applicantNotePlaceholder: 'Kurz: was ist der nächste Schritt?',
  advanceTo: 'Weiter zu',
  decline: 'Absagen',
  changeStage: 'Stand ändern',
  stageChanged: 'Zuletzt geändert',
  supportedBy: 'Begleitet von',
  supportedByNobody: 'Niemand zugewiesen',
  hoursOnEnd: 'Geleistete Stunden (optional)',
  evidenceCreated: 'Nachweis erstellt',
  evidenceHint: 'Beim Start entsteht automatisch ein Eintrag in «Lernen & Beruf».',
  openResident: 'Zum Dossier',

  save: 'Speichern',
  saving: 'Wird gespeichert…',
  cancel: 'Abbrechen',
  publish: 'Veröffentlichen',
  archive: 'Archivieren',
  edit: 'Bearbeiten',
} as const
