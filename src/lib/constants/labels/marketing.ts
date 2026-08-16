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
  eyebrow: 'Wohnen ohne Zufallsprinzip',
  headline: 'Wer zusammen wohnt, sollte zusammenpassen.',
  subline:
    'Menschen werden heute nach freien Betten platziert — nicht danach, ob sie miteinander leben können. Diese Software macht den Unterschied sichtbar, bevor jemand einzieht.',
  ctaPrimary: 'Produkt ansehen',
  ctaSecondary: 'Anmelden',
  ctaNote: 'Kein Konto nötig. Sie sehen das echte Produkt mit Beispieldaten.',

  problemEyebrow: 'Das Problem',
  problemTitle: 'Ein Konflikt beginnt bei der Zuteilung, nicht bei der Eskalation.',
  problems: [
    {
      title: 'Platziert wird nach Verfügbarkeit',
      body: 'Wer wo einzieht, entscheidet sich am freien Bett. Schlafrhythmus, Lärmempfinden und Ordnungsanspruch tauchen erst auf, wenn sie aneinandergeraten.',
    },
    {
      title: 'Konflikte kosten zuerst Menschen, dann Zeit',
      body: 'Streit im Zimmer trifft Menschen in einer ohnehin schwierigen Lage. Danach bindet er die Betreuung, die eigentlich betreuen sollte.',
    },
    {
      title: 'Erfahrung bleibt in Köpfen',
      body: 'Was in einer Wohnung funktioniert hat, weiss die Person, die dabei war. Wechselt sie die Stelle, beginnt das Lernen von vorn.',
    },
  ],

  howEyebrow: 'So funktioniert es',
  howTitle: 'Vier Schritte, keine Blackbox.',
  steps: [
    {
      title: 'Präferenzen erfassen',
      body: 'Schlafrhythmus, Lärmtoleranz, Ordnung, Sprachen, Rauchen. Nur was fürs Zusammenleben zählt.',
    },
    {
      title: 'Kompatibilität berechnen',
      body: 'Jede Kombination bekommt einen Wert — und eine Begründung in einem Satz, die man vorlesen kann.',
    },
    {
      title: 'Entscheiden — nicht entscheiden lassen',
      body: 'Die Software empfiehlt und warnt. Platziert wird von einem Menschen, mit dokumentiertem Grund.',
    },
    {
      title: 'Ergebnis zurückspielen',
      body: 'Vorfälle und Verläufe fliessen zurück in die Einschätzung. Die nächste Platzierung weiss mehr als die letzte.',
    },
  ],

  featuresEyebrow: 'Im Produkt',
  featuresTitle: 'Was die Betreuung und was die Bewohnenden bekommen.',
  features: [
    {
      icon: 'puzzle',
      title: 'Kompatibilität',
      body: 'Ein Wert pro Kombination, mit der Richtung des Konflikts — wer sich an wem stören wird, nicht nur dass es nicht passt.',
    },
    {
      icon: 'scroll',
      title: 'Hausregeln, die gelten',
      body: 'Ein Regelwerk in zwei Stufen: was die Organisation vorgibt und was die Wohnung selbst bestimmen darf.',
    },
    {
      icon: 'vote',
      title: 'Beschlüsse statt Aushang',
      body: 'Die Wohnung stimmt ab, das Ergebnis ist nachvollziehbar begründet. Sicherheit wird nie zur Abstimmung gestellt.',
    },
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
      icon: 'alert',
      title: 'Konflikte mit Leiter',
      body: 'Von der Selbstklärung bis zur formellen Massnahme — mit der Regel, dass Sicherheit nie unten anfängt.',
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

  blogEyebrow: 'Technik-Blog',
  blogTitle: 'Warum das Produkt so gebaut ist, wie es ist.',
  blogLink: 'Alle Beiträge lesen',

  closingTitle: 'Sehen Sie es sich an.',
  closingBody:
    'Die Demo ist das echte Produkt mit Beispieldaten — beide Seiten, Verwaltung und Bewohnendenportal.',
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
