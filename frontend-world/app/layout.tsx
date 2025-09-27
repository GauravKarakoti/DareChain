import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import { Web3Provider }from '@/components/providers/Web3Provider'
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DareChain - Decentralized Truth & Dare',
  description: 'Participate in fun challenges while preserving privacy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <MiniKitProvider>
        <body className={inter.className}>
          <Web3Provider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </Web3Provider>
        </body>
      </MiniKitProvider>
    </html>
  )
}