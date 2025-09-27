'use client'

import { useState, useEffect } from 'react'
import { useWeb3 } from '@/components/providers/Web3Provider'
import DareCard from '@/components/dare/DareCard'
import { Dare } from '@/lib/types'
import { Search, Filter } from 'lucide-react'

// Mock data - replace with actual contract calls
const mockDares: Dare[] = [
  {
    id: 1,
    title: "Sing in public",
    description: "Sing your favorite song loudly in a crowded place",
    creator: "0x742d35Cc6634C0532925a3b8D6B398F2A6C8b1a1",
    reward: "10.00",
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    completed: false,
    participants: 5,
    proofRequired: "video"
  },
  {
    id: 2,
    title: "Dance in the rain",
    description: "Do a 1-minute dance routine in the rain",
    creator: "0x842d35Cc6634C0532925a3b8D6B398F2A6C8b1a2",
    reward: "15.00",
    deadline: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    completed: false,
    participants: 3,
    proofRequired: "video"
  }
]

export default function DaresPage() {
  const { isConnected } = useWeb3()
  const [dares, setDares] = useState<Dare[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // TODO: Replace with actual contract data fetching
    setDares(mockDares)
  }, [])

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view dares</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Dares</h1>
          <p className="text-gray-600">Find challenges that excite you</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search dares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Dares</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="high-reward">High Reward</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dares.map((dare) => (
          <DareCard key={dare.id} dare={dare} />
        ))}
      </div>

      {dares.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No dares found. Be the first to create one!</p>
        </div>
      )}
    </div>
  )
}