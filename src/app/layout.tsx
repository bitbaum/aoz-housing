import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { APP_LABELS } from '@/lib/constants/labels'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: APP_LABELS.metaTitle,
  description: APP_LABELS.metaDescription,
  icons: {
    icon: '/favicon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: APP_LABELS.metaTitle,
    description: APP_LABELS.metaDescription,
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen bg-aoz-background font-sans">
        {children}
      </body>
    </html>
  )
}
