import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { APP_LABELS } from '@/lib/constants/labels'
import { ToastContainer } from '@/components/ui/Toast'
import './globals.css'
import { BRAND } from '@/lib/config/brand'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

/**
 * Numeric and code-like data (occupancy counts, compatibility scores, login
 * codes, dates) is set in mono with tabular figures so digits keep a constant
 * width and columns stay aligned. @see the `.numeric` class in globals.css.
 */
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
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
    <html
      lang="de"
      className={`${inter.variable} ${mono.variable}`}
      data-brand={BRAND.id}
    >
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-ui-canvas text-ui-text font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
