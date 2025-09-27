import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from '@vercel/analytics/next'
import "./globals.css"

export const metadata: Metadata = {
  title: "DareX Mini App",
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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Vercel Analytics placeholder - only loads in production
                console.log('[v0] Analytics would load in production');
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
