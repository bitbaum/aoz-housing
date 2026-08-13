import type { Metadata } from 'next'
import { APP_LABELS, REGISTER_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = {
  title: REGISTER_LABELS.title,
  description: APP_LABELS.metaDescription,
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
