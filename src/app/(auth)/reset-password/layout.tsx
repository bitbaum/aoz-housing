import type { Metadata } from 'next'
import { APP_LABELS, RESET_PASSWORD_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = {
  title: RESET_PASSWORD_LABELS.title,
  description: APP_LABELS.metaDescription,
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
