import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DisasterProvider } from '@/src/context/DisasterContext'
import { PwaRegister } from '@/components/pwa-register'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Megh-Drishti | AI Spatio-Temporal Weather Anomaly Engine (MoES PS 26078)',
  description:
    'AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies in Medium-Range Forecasts | Ministry of Earth Sciences (MoES PS 26078). Real-time synoptic tracking, GFS/ECMWF divergence analysis, and IMD/NCMRWF cycle early warning.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  other: {
    'darkreader-lock': 'true',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
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
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1A1918',
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
    <html
      lang="en"
      className={cn('dark', inter.variable, sourceSerif4.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" content="true" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased font-sans bg-[#1A1918] text-[#ECEAE6]" suppressHydrationWarning>
        <DisasterProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </DisasterProvider>
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
