'use client'

import { useWeb3 } from '@/components/providers/Web3Provider'
import CreateDareForm from '@/components/dare/CreateDareForm'

export default function CreateDarePage() {
  const { isConnected } = useWeb3()

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to create a dare</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Dare</h1>
          <p className="text-gray-600">Set up a fun challenge for the community</p>
        </div>
        
        <CreateDareForm />
      </div>
    </div>
  )
}