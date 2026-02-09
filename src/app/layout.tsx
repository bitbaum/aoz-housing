import type { Metadata } from 'next'
import { APP_LABELS } from '@/lib/constants/labels'
import './globals.css'

export const metadata: Metadata = {
  title: APP_LABELS.metaTitle,
  description: APP_LABELS.metaDescription,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-aoz-background">
        {children}
      </body>
    </html>
  )
}
