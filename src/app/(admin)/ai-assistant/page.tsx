import type { Metadata } from 'next'
import { AIChatInterface } from '@/components/ai/AIChatInterface'

export const metadata: Metadata = { title: 'KI-Assistent' }

export default function AIAssistantPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">KI-Assistent</h1>
        <p className="text-gray-500 mt-1">
          Stellen Sie Fragen zu Bewohnern, Unterkünften, Vorfällen und Statistiken.
        </p>
      </div>
      <div className="card">
        <AIChatInterface />
      </div>
    </div>
  )
}
