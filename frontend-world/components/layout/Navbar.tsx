'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWeb3 } from '@/components/providers/Web3Provider'
import { Wallet, Trophy, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const { account, connectWallet, disconnectWallet } = useWeb3()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">DareChain</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dares" className="text-gray-700 hover:text-primary-600 transition-colors">
              Explore Dares
            </Link>
            <Link href="/dares/create" className="text-gray-700 hover:text-primary-600 transition-colors">
              Create Dare
            </Link>
            <Link href="/betting" className="text-gray-700 hover:text-primary-600 transition-colors">
              Betting
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-primary-50 rounded-full px-3 py-1">
                  <User className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="btn-primary flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}