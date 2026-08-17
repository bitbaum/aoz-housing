import type { Metadata } from 'next'
import { AlgorithmContent } from '@/components/algorithm/AlgorithmContent'
import { requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: 'Algorithmus' }

export default async function AlgorithmPage() {
  await requirePermission('system:configure')
  return <AlgorithmContent />
}
