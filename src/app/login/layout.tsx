import type { Metadata } from 'next'
import { APP_LABELS, LOGIN_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = {
  title: LOGIN_LABELS.title,
  description: APP_LABELS.metaDescription,
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-aoz-background flex items-center justify-center p-4">
      {children}
    </div>
  )
}
