import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "DareX Telegram Mini App",
  description: "Create, accept, and prove dares with crypto rewards",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
        <Providers>
          <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
            {children}
          </body>
        </Providers>
    </html>
  )
}