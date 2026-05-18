import type { Metadata } from 'next'
import { AIChatInterface } from '@/components/ai/AIChatInterface'
import { AI_ASSISTANT_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'KI-Assistent' }

export default function AIAssistantPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text">KI-Assistent</h1>
        <p className="text-ui-muted mt-1">
          {AI_ASSISTANT_LABELS.subtitle}
        </p>
      </div>
      <div className="card">
        <AIChatInterface />
      </div>
    </div>
  )
}
