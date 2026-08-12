import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'
import { PWAInstallPrompt } from '@/components/ui/pwa-prompt'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reachly - WhatsApp Business API Platform',
  description: 'Manage WhatsApp Business API messages, customers, and campaigns with ease',
  keywords: 'WhatsApp, Business API, messaging, CRM, marketing, bulk messaging',
  authors: [{ name: 'Reachly Team' }],
  creator: 'Reachly',
  publisher: 'Reachly',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reachly.com',
    title: 'Reachly - WhatsApp Business API Platform',
    description: 'Manage WhatsApp Business API messages, customers, and campaigns with ease',
    siteName: 'Reachly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reachly - WhatsApp Business API Platform',
    description: 'Manage WhatsApp Business API messages, customers, and campaigns with ease',
    creator: '@reachly',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}