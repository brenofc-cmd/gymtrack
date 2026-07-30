import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration'
import './globals.css'

// Fontes self-hosted (OFL, assets/fonts/LICENSE.txt): o build não pode
// depender do Google Fonts (P0-3 da auditoria).
const geist = localFont({
  src: '../assets/fonts/Geist-Variable.woff2',
  variable: '--font-geist',
  weight: '100 900',
})

const geistMono = localFont({
  src: '../assets/fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'GymTrack',
  description: 'Seu app pessoal de treino',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GymTrack',
    startupImage: [],
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0D10',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              classNames: {
                toast: 'bg-card border-border text-foreground',
                success: 'border-primary/30',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
