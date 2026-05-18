import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { APP_LABELS } from '@/lib/constants/labels'
import { ToastContainer } from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_LABELS.name}`,
    default: APP_LABELS.metaTitle,
  },
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
  const themeScript = `
    (() => {
      try {
        const mode = window.localStorage.getItem('aoz-theme');
        if (mode === 'light' || mode === 'dark') {
          document.documentElement.dataset.theme = mode;
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      } catch {}
    })();
  `

  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen bg-ui-canvas text-ui-text font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
