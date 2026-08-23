import type { Metadata } from 'next'
import { AlgorithmContent } from '@/components/algorithm/AlgorithmContent'
import { requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: 'Algorithmus' }

export default async function AlgorithmPage() {
  // Read-only methodology documentation. Every staff role sees compatibility
  // scores somewhere (matching, resident cards, analytics) — "no black-box
  // decisions" means everyone who sees a score may read how it is computed.
  // It was gated behind system:configure for months, which 403'd the
  // "Wie funktioniert der Algorithmus?" link on /matching for BETREUUNG —
  // the role the page exists for.
  await requirePermission('dashboard:read')
  return <AlgorithmContent />
}
