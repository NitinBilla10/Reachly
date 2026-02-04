import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(142, 76%, 36%)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(0, 84%, 60%)',
                  secondary: 'white',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}