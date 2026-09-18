import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DisasterProvider } from '@/src/context/DisasterContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Megh-Drishti | AI Spatio-Temporal Weather Anomaly Engine (MoES PS 26078)',
  description:
    'AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies in Medium-Range Forecasts | Ministry of Earth Sciences (MoES PS 26078). Real-time synoptic tracking, GFS/ECMWF divergence analysis, and IMD/NCMRWF cycle early warning.',
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
  viewportFit: 'cover',
  initialScale: 1,
  width: 'device-width',
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
