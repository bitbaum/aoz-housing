import type { Metadata } from 'next'
import { APP_LABELS, FORGOT_PASSWORD_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = {
  title: FORGOT_PASSWORD_LABELS.title,
  description: APP_LABELS.metaDescription,
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
