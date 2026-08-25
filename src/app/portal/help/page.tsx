import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/Page'
import { getRequestTranslator } from '@/lib/i18n/request'
import { ORG_CONTACT, ORG_CONTACT_CHANNELS } from '@/lib/config/organization'
import type { MessageKey } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.help') }
}
const FAQ_KEYS: { q: MessageKey; a: MessageKey }[] = [
  { q: 'help.faq.placement.q', a: 'help.faq.placement.a' },
  { q: 'help.faq.preferences.q', a: 'help.faq.preferences.a' },
  { q: 'help.faq.conflict.q', a: 'help.faq.conflict.a' },
  { q: 'help.faq.transfer.q', a: 'help.faq.transfer.a' },
  { q: 'help.faq.privacy.q', a: 'help.faq.privacy.a' },
]

export default async function PortalHelpPage() {
  const { t } = await getRequestTranslator()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <PageHeader
          title={t('help.title')}
          description={t('help.subtitle')}
          backHref="/portal"
          backLabel={t('action.back')}
        />
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{t('help.faqTitle')}</h2>
        <div className="space-y-3">
          {FAQ_KEYS.map((faq) => (
            <FAQItem key={faq.q} question={t(faq.q)} answer={t(faq.a)} />
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{t('help.contactTitle')}</h2>
        <div className="space-y-4">
          {ORG_CONTACT_CHANNELS.map((c) => (
            <ContactItem key={c.label} icon={c.icon} label={c.label} value={c.value} sublabel={c.sublabel} />
          ))}
        </div>
      </div>

      <div className="card border-l-4 border-l-status-error bg-status-error/8">
        <h2 className="text-lg font-semibold text-ui-text mb-2">{t('help.emergencyTitle')}</h2>
        <p className="text-sm text-ui-muted mb-4">{t('help.emergencyDesc')}</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🚨</span>
            <div>
              <p className="font-semibold text-status-error-text">{ORG_CONTACT.emergency.police}</p>
              <p className="text-lg font-bold text-status-error-text">{ORG_CONTACT.emergency.policeNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🆘</span>
            <div>
              <p className="font-semibold text-ui-text">{ORG_CONTACT.emergency.orgLabel}</p>
              <p className="text-lg font-bold text-ui-text">{ORG_CONTACT.emergency.orgNumber}</p>
              <p className="text-sm text-ui-muted">{ORG_CONTACT.emergency.orgHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link href="/portal/report" className="card-hover flex items-center gap-4 p-4">
          <span className="text-2xl" aria-hidden="true">📣</span>
          <div>
            <p className="font-medium text-ui-text">{t('help.link.report')}</p>
            <p className="text-sm text-ui-muted">{t('report.subtitle')}</p>
          </div>
        </Link>
        <Link href="/portal/rules" className="card-hover flex items-center gap-4 p-4">
          <span className="text-2xl" aria-hidden="true">📋</span>
          <div>
            <p className="font-medium text-ui-text">{t('help.link.rules')}</p>
            <p className="text-sm text-ui-muted">{t('rules.subtitle')}</p>
          </div>
        </Link>
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
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-sm text-ui-muted">{label}</p>
        <p className="font-medium text-ui-text">{value}</p>
        {sublabel && <p className="text-xs text-ui-muted">{sublabel}</p>}
      </div>
    </div>
  )
}
