import type { Metadata } from 'next'
import { AlgorithmContent } from '@/components/algorithm/AlgorithmContent'

export const metadata: Metadata = { title: 'Algorithmus' }

export default function AlgorithmPage() {
  return <AlgorithmContent />
}
