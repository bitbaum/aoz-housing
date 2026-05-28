import type { Metadata } from 'next'
import { AIChatInterface } from '@/components/ai/AIChatInterface'
import { PageHeader } from '@/components/ui/Page'
import { AI_ASSISTANT_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'KI-Assistent' }

export default function AIAssistantPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <PageHeader title="KI-Assistent" description={AI_ASSISTANT_LABELS.subtitle} />
      </div>
      <div className="card">
        <AIChatInterface />
      </div>
    </div>
  )
}
