'use client'

import { useWeb3 } from '@/components/providers/Web3Provider'

export default function BettingPage() {
  const { isConnected } = useWeb3()

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access betting</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Betting Pool</h1>
      <p className="text-gray-600 mb-8">Bet on dare outcomes and earn PYUSD rewards</p>
      
      <div className="card text-center py-12">
        <p className="text-gray-600">Betting feature coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This section will allow you to bet on whether dares will be completed successfully
        </p>
      </div>
    </div>
  )
}