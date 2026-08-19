import { BRAND, type BrandId } from '@/lib/config/brand'

/**
 * The public landing page — the only surface that speaks to someone who has
 * never logged in.
 *
 * WHY THE COPY IS PER BRAND. The product ships in two registers and they are
 * not interchangeable. `aoz`/`aozh` are shown to an organisation deciding
 * whether to place people with software; `wg` runs in a real shared flat where
 * nobody is "placed" by a "system" and the reader is a person who lives there.
 * The same landing page for both would be wrong for at least one of them.
 *
 * WHY IT IS A `Record<BrandId, …>` AND NOT A LOOKUP WITH A FALLBACK. A new
 * brand must not silently inherit somebody else's pitch — the compiler asks for
 * its copy instead.
 *
 * WHAT IS DELIBERATELY ABSENT: numbers. No "30% fewer conflicts", no residents
 * housed, no hours saved. This product is measured by a pilot that has not
 * reported yet, and a landing page that invents its own evidence is the one
 * thing that would disqualify it in front of the people being asked to trust
 * it with vulnerable residents. Everything claimed here is a description of
 * what the software does, which is checkable by pressing the demo button.
 */

export interface MarketingSection {
  title: string
  body: string
}

export interface MarketingFeature {
  title: string
  body: string
  /** Key into NAV_ICONS — features reuse the navigation's icon set. */
  icon: string
}

export interface MarketingCopy {
  /** Small line above the headline. */
  eyebrow: string
  headline: string
  subline: string
  ctaPrimary: string
  ctaSecondary: string
  ctaNote: string

  problemEyebrow: string
  problemTitle: string
  problems: MarketingSection[]

  howEyebrow: string
  howTitle: string
  steps: MarketingSection[]

  featuresEyebrow: string
  featuresTitle: string
  features: MarketingFeature[]

  ethicsEyebrow: string
  ethicsTitle: string
  ethicsBody: string
  /** Things the system refuses to record. Stated as a promise, kept as code. */
  neverTracked: string[]

  blogEyebrow: string
  blogTitle: string
  blogLink: string

  closingTitle: string
  closingBody: string
}

/** The pitch register: an organisation deciding whether to use this. */
const PLACEMENT_COPY: MarketingCopy = {
  eyebrow: 'Stabilität, Integration, Begleitung',
  headline: 'Ein System für Fachpersonen, das Wohnen und Integration zusammenführt.',
  subline:
    'Housing ist der Anfang, nicht das ganze Bild. Das Produkt verbindet Stabilität, Sprache, Qualifikation, Teilhabe und koordinierte Begleitung in einem System, das Fachpersonen im Alltag wirklich verwenden können — inklusive Matching, Platzierung und Folgeschritten.',
  ctaPrimary: 'Produkt ansehen',
  ctaSecondary: 'Anmelden',
  ctaNote: 'Kein Konto nötig. Sie sehen das echte Produkt mit Beispieldaten.',

  problemEyebrow: 'Das Problem',
  problemTitle: 'Integration scheitert oft an Fragmentierung, nicht an fehlendem Willen.',
  problems: [
    {
      title: 'Stabilität und Fortschritt laufen getrennt',
      body: 'Housing, Sprache, Arbeit, Teilhabe und Betreuungsschritte liegen oft in verschiedenen Listen, Köpfen und Postfächern. Niemand sieht schnell genug, was als Nächstes zählt.',
    },
    {
      title: 'Instabilität frisst Betreuungszeit',
      body: 'Konflikte, ungeklärte Transfers, verpasste Rückmeldungen und offene Follow-ups binden Fachpersonen genau dort, wo sie eigentlich begleiten sollten.',
    },
    {
      title: 'Evidenz bleibt zu oft folgenlos',
      body: 'Kurse, Sprachtests, Qualifikationen oder freiwilliges Engagement werden dokumentiert, aber nicht konsequent in Prioritäten, Boards und nächste Schritte übersetzt.',
    },
  ],

  howEyebrow: 'So funktioniert es',
  howTitle: 'Vier Arbeitsbereiche, ein gemeinsamer Verlauf.',
  steps: [
    {
      title: 'Stabilität sichern',
      body: 'Housing, Sicherheit, Vorfälle, Transfers und Regeln bilden die belastbare Basis. Ohne Stabilität trägt keine Integration.',
    },
    {
      title: 'Capability sichtbar machen',
      body: 'Sprache, Kurse, Qualifikationen und Arbeitsmarktschritte werden als evidenzbasierter Verlauf erfasst, nicht als lose Notizen.',
    },
    {
      title: 'Participation fördern',
      body: 'Freiwilligenarbeit, Aktivitäten, soziale Teilhabe und Alltagsorientierung werden als echte Fortschrittssignale sichtbar gemacht.',
    },
    {
      title: 'Guidance schliessen',
      body: 'Boards, Follow-ups, Nachrichten und nächste Schritte führen Fachpersonen zurück in eine klare Handlung statt in offene Schleifen.',
    },
  ],

  featuresEyebrow: 'Im Produkt',
  featuresTitle: 'Vier Pfeiler für Fachpersonen und Klient*innen.',
  features: [
    {
      icon: 'building',
      title: 'Stability',
      body: 'Housing, Sicherheit, Vorfälle, Verlegungen und Regeln in einem operativen Verlauf statt in isolierten Einzelfunktionen.',
    },
    {
      icon: 'learning',
      title: 'Capability',
      body: 'Sprache, Kurse, Qualifikationen und Arbeitsmarktnähe werden als verwertbare Evidenz sichtbar, filterbar und teamfähig.',
    },
    {
      icon: 'volunteer',
      title: 'Participation',
      body: 'Freiwilligenarbeit, Aktivitäten, soziale Kontakte und Alltagsorientierung werden nicht nur angeboten, sondern im Verlauf nachvollziehbar.',
    },
    {
      icon: 'message',
      title: 'Guidance',
      body: 'Care Team, Nachrichten, Follow-ups, Boards und nächste Schritte sorgen dafür, dass Verantwortung sichtbar bleibt und Antwortschlaufen sich schliessen.',
    },
  ],

  ethicsEyebrow: 'Grenzen',
  ethicsTitle: 'Was diese Software über Menschen nicht wissen will.',
  ethicsBody:
    'Das System dient Menschen in einer verletzlichen Lage. Erfasst wird ausschliesslich, was fürs Zusammenleben nötig ist — und was nicht erfasst wird, lässt sich auch nicht gegen jemanden verwenden.',
  neverTracked: [
    'Medizinische Diagnosen',
    'Aufenthaltsstatus oder Dossierdetails',
    'Religion und politische Überzeugung',
    'Persönliche Geschichte ohne Wohnbezug',
  ],

  blogEyebrow: 'Blog und Produktdokumente',
  blogTitle: 'Warum das Produkt so gebaut ist und wie es sich weiterentwickelt.',
  blogLink: 'Alle Beiträge lesen',

  closingTitle: 'Sehen Sie es sich an.',
  closingBody:
    'Die Demo ist das echte Produkt mit Beispieldaten — Verwaltung, Begleitung und Bewohner*innen-Portal. Blog, Roadmap und Changelog machen die Produktentscheidungen nachvollziehbar.',
}

/** The household register: the people who actually live in the flat. */
const HOUSEHOLD_COPY: MarketingCopy = {
  eyebrow: 'Gemeinsam wohnen',
  headline: 'Die Wohnung, auf die ihr euch einigen könnt.',
  subline:
    'Wer hat den Abfall rausgebracht, wer hat das WC-Papier bezahlt, und ab wann ist es zu laut? Alles an einem Ort — damit es nicht jedes Mal von vorn ausgehandelt wird.',
  ctaPrimary: 'Ausprobieren',
  ctaSecondary: 'Anmelden',
  ctaNote: 'Kein Konto nötig. Du siehst das echte Produkt mit Beispieldaten.',

  problemEyebrow: 'Warum',
  problemTitle: 'Streit in einer WG ist selten ein Streit über die Sache.',
  problems: [
    {
      title: 'Alle glauben, sie machen mehr',
      body: 'Man erinnert sich an die eigene Arbeit besser als an die der anderen. Das ist normal — und es reicht, damit sich alle ungerecht behandelt fühlen.',
    },
    {
      title: 'Abmachungen verschwinden',
      body: 'Was im Flur besprochen wurde, gilt genau so lange, bis sich zwei Leute unterschiedlich daran erinnern.',
    },
    {
      title: 'Geld macht es persönlich',
      body: 'Kleine Beträge, die niemand aufschreibt, werden zu einem Gefühl darüber, wer sich wie verhält.',
    },
  ],

  howEyebrow: 'So läuft es',
  howTitle: 'Aufschreiben, abmachen, nachschauen.',
  steps: [
    {
      title: 'Aufgaben festhalten',
      body: 'Putzen, Abfall, Einkauf. Wer es gemacht hat, steht da — nicht nur, wer dran gewesen wäre.',
    },
    {
      title: 'Ausgaben teilen',
      body: 'Ausgabe eintragen, Anteile werden berechnet. Der Kontostand sagt, wer wem was schuldet.',
    },
    {
      title: 'Gemeinsam entscheiden',
      body: 'Vorschlag einbringen, alle stimmen ab, das Ergebnis ist die Hausregel. Nachlesbar, mit Datum.',
    },
    {
      title: 'Melden, was kaputt ist',
      body: 'Der tropfende Wasserhahn geht an die Verwaltung, der Konflikt an die Betreuung. Ihr seht die Antwort.',
    },
  ],

  featuresEyebrow: 'Drin',
  featuresTitle: 'Was ihr benutzen könnt.',
  features: [
    {
      icon: 'wallet',
      title: 'Geteilte Ausgaben',
      body: 'Wer hat was bezahlt, wer schuldet wem. Auf den Rappen genau, mit dem kürzesten Ausgleichsweg.',
    },
    {
      icon: 'calendar',
      title: 'Aufgaben und Fairness',
      body: 'Der Putzplan als Bilanz statt als Rangliste: sichtbar, wer wie viel getragen hat.',
    },
    {
      icon: 'scroll',
      title: 'Hausregeln',
      body: 'Was in dieser Wohnung gilt, an einem Ort — und jede Änderung wird allen neu vorgelegt.',
    },
    {
      icon: 'vote',
      title: 'Abstimmen',
      body: 'Vorschläge, Fristen, Ergebnis mit Begründung. Sicherheit wird nie zur Abstimmung gestellt.',
    },
    {
      icon: 'building',
      title: 'Eure Wohnung',
      body: 'Ein Name, den ihr wählt, die Zimmer und wer hier wohnt. Mit Foto, wenn ihr wollt.',
    },
    {
      icon: 'alert',
      title: 'Melden',
      body: 'Schaden oder Konflikt — landet bei der Stelle, die etwas tun kann, und die Antwort kommt zurück.',
    },
  ],

  ethicsEyebrow: 'Privatsphäre',
  ethicsTitle: 'Was die App über euch nicht wissen will.',
  ethicsBody:
    'Standardmässig habt ihr nicht einmal einen Namen in der App — euer Code genügt. Name, Foto und Text sind freiwillig, und Fotos sehen nur ihr und eure Mitbewohnenden.',
  neverTracked: [
    'Medizinische Diagnosen',
    'Aufenthaltsstatus oder Dossierdetails',
    'Religion und politische Überzeugung',
    'Persönliche Geschichte ohne Wohnbezug',
  ],

  blogEyebrow: 'Technik-Blog',
  blogTitle: 'Warum das Produkt so gebaut ist, wie es ist.',
  blogLink: 'Alle Beiträge lesen',

  closingTitle: 'Schau es dir an.',
  closingBody:
    'Die Demo ist das echte Produkt mit Beispieldaten — du siehst genau das, was die Bewohnenden sehen.',
}

const MARKETING_BY_BRAND: Record<BrandId, MarketingCopy> = {
  aoz: PLACEMENT_COPY,
  aozh: PLACEMENT_COPY,
  wg: HOUSEHOLD_COPY,
}

/** Landing copy for the brand this deployment runs under. */
export const MARKETING_COPY: MarketingCopy = MARKETING_BY_BRAND[BRAND.id]

/** Exported for the test that checks every brand has its own complete pitch. */
export const MARKETING_COPY_BY_BRAND = MARKETING_BY_BRAND
