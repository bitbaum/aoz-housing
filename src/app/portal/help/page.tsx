import type { Metadata } from 'next'
import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = { title: 'Hilfe' }

export default function PortalHelpPage() {
  const faqs = [
    {
      question: 'Wie funktioniert die Zimmerverteilung?',
      answer:
        'Wir berücksichtigen verschiedene Faktoren wie Schlafrhythmus, Lärmtoleranz und Sprachkenntnisse, um passende Mitbewohner zu finden. Je genauer Ihre Angaben, desto besser können wir Sie platzieren.',
    },
    {
      question: 'Kann ich meine Präferenzen ändern?',
      answer:
        'Ja, Sie können Ihre Präferenzen jederzeit unter "Einstellungen" aktualisieren. Änderungen werden bei zukünftigen Platzierungen berücksichtigt.',
    },
    {
      question: 'Was passiert bei einem Konflikt mit Mitbewohnern?',
      answer:
        'Bitte melden Sie Probleme über "Problem melden" in Ihrem Portal. Wir nehmen alle Meldungen ernst und suchen gemeinsam nach Lösungen.',
    },
    {
      question: 'Wie lange dauert eine Platzierung?',
      answer:
        'Die Dauer hängt von Ihrer individuellen Situation ab. Wir informieren Sie über voraussichtliche Zeiträume und mögliche Änderungen.',
    },
    {
      question: 'Kann ich einen Umzug beantragen?',
      answer:
        'Bei berechtigten Gründen können Sie einen Umzug beantragen. Sprechen Sie mit Ihrer Betreuungsperson oder nutzen Sie das Meldeformular.',
    },
    {
      question: 'Was bedeuten die Kompatibilitätswerte?',
      answer:
        'Die Werte zeigen, wie gut Sie voraussichtlich mit anderen Bewohnern zusammenpassen. Hohe Werte bedeuten ähnliche Präferenzen bei Schlaf, Sauberkeit und Sozialverhalten.',
    },
    {
      question: 'Werden meine Daten geschützt?',
      answer:
        'Ja, Ihre Daten werden nur zur Zimmerzuteilung verwendet und nicht an Dritte weitergegeben. Sie können Ihre Daten jederzeit einsehen oder löschen lassen.',
    },
    {
      question: 'An wen wende ich mich bei technischen Problemen?',
      answer:
        'Bei technischen Problemen mit dem Portal wenden Sie sich bitte an die unten stehenden Kontakte oder sprechen Sie Ihre Betreuungsperson an.',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{PORTAL_LABELS.pages.help}</h1>
        <p className="text-gray-500">
          {PORTAL_LABELS.pages.helpSubtitle}
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Häufig gestellte Fragen
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Kontakt
        </h2>
        <div className="space-y-4">
          <ContactItem
            icon="📞"
            label="Allgemeine Anfragen"
            value="044 415 66 66"
            sublabel="Mo-Fr 8:00-17:00"
          />
          <ContactItem
            icon="📧"
            label="E-Mail"
            value="wohnen@aoz.ch"
            sublabel="Antwort innerhalb von 2 Arbeitstagen"
          />
          <ContactItem
            icon="📍"
            label="Adresse"
            value="AOZ Zürich"
            sublabel="Zollstrasse 115, 8005 Zürich"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card border-l-4 border-l-red-500 bg-red-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Notfall
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Bei Notfällen oder akuter Gefahr wenden Sie sich sofort an:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-red-700">Polizei / Rettung</p>
              <p className="text-lg font-bold text-red-700">117 / 144</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🆘</span>
            <div>
              <p className="font-semibold text-gray-900">AOZ Notfallnummer</p>
              <p className="text-lg font-bold text-gray-900">044 415 66 00</p>
              <p className="text-sm text-gray-500">24h erreichbar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link
          href="/portal/preferences"
          className="card-hover flex items-center gap-4 p-4"
        >
          <span className="text-2xl">⚙️</span>
          <div>
            <p className="font-medium text-gray-900">Einstellungen</p>
            <p className="text-sm text-gray-500">Präferenzen anpassen</p>
          </div>
        </Link>
        <Link
          href="/portal/report"
          className="card-hover flex items-center gap-4 p-4"
        >
          <span className="text-2xl">📝</span>
          <div>
            <p className="font-medium text-gray-900">Problem melden</p>
            <p className="text-sm text-gray-500">Vorfall oder Anliegen</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{question}</span>
        <span className="text-gray-500 group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="p-4 text-sm text-gray-600">{answer}</div>
    </details>
  )
}

function ContactItem({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: string
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
        {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
      </div>
    </div>
  )
}
