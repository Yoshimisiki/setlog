import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SETLOG — Setlist maker for live musicians",
  description: "Create your live setlist with time management and share a URL fans can use to listen on streaming services.",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/setlog-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/setlog-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/setlog-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'SETLOG',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: "SETLOG",
    description: "Setlist maker for live musicians",
    type: "website",
  },
}

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark">
      <head>
        {adsenseId && (
          <>
            <meta name="google-adsense-account" content={adsenseId} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
