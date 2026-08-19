import { ORG_CONTACT } from '@/lib/config/organization'
import type { Translator } from '@/lib/i18n'

/** Contact sentence with org phone/email from `ORG_CONTACT` SSOT. */
export function contactFallbackSentence(t: Translator): string {
  return `${t('contact.fallbackLead')} ${ORG_CONTACT.maintenancePhone} (${ORG_CONTACT.maintenanceHours}) ${t('contact.fallbackOr')} ${ORG_CONTACT.maintenanceEmail}.`
}
