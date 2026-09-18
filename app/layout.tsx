import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DisasterProvider } from '@/src/context/DisasterContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'NER-Rakshak | AI Landslide & Risk Early Warning System',
  description:
    'AI-powered disaster management and early warning dashboard for the North Eastern Region of India — landslide risk, field reports, and weather alerts.',
  generator: 'v0.app',
  other: {
    'darkreader-lock': 'true',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0f0d',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <DisasterProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </DisasterProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
