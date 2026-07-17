import type { Metadata } from 'next'
import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PageHeader } from '@/components/ui/Page'

export const metadata: Metadata = { title: 'Hilfe' }

const H = PORTAL_LABELS.help

export default function PortalHelpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <PageHeader
          title={PORTAL_LABELS.pages.help}
          description={PORTAL_LABELS.pages.helpSubtitle}
          backHref="/portal"
          backLabel={PORTAL_LABELS.form.back.replace(/^← /, '')}
        />
      </div>

      {/* FAQ Accordion */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{H.faqTitle}</h2>
        <div className="space-y-3">
          {H.faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{H.contactTitle}</h2>
        <div className="space-y-4">
          {H.contacts.map((c, i) => (
            <ContactItem key={i} icon={c.icon} label={c.label} value={c.value} sublabel={c.sublabel} />
          ))}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card border-l-4 border-l-status-error bg-status-error/8">
        <h2 className="text-lg font-semibold text-ui-text mb-2">{H.emergencyTitle}</h2>
        <p className="text-sm text-ui-muted mb-4">{H.emergencyDesc}</p>
        <div className="space-y-3">
          {H.emergency.numbers.map((entry) => (
            <div key={entry.number} className="flex items-center gap-3">
              <span className="text-2xl">{entry.icon}</span>
              <div>
                <p className="font-semibold text-status-error-text">{entry.label}</p>
                <p className="text-lg font-bold text-status-error-text">{entry.number}</p>
                {'note' in entry && entry.note && (
                  <p className="text-sm text-ui-muted">{entry.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {H.quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="card-hover flex items-center gap-4 p-4">
            <span className="text-2xl">{link.icon}</span>
            <div>
              <p className="font-medium text-ui-text">{link.title}</p>
              <p className="text-sm text-ui-muted">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer p-4 bg-ui-subtle rounded-lg hover:bg-ui-subtle transition-colors">
        <span className="font-medium text-ui-text">{question}</span>
        <span className="text-ui-muted group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="p-4 text-sm text-ui-muted">{answer}</div>
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
        <p className="text-sm text-ui-muted">{label}</p>
        <p className="font-medium text-ui-text">{value}</p>
        {sublabel && <p className="text-xs text-ui-muted">{sublabel}</p>}
      </div>
    </div>
  )
}
