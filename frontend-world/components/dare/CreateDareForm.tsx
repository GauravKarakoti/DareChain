'use client'

import { useState } from 'react'
import { useWeb3 } from '@/components/providers/Web3Provider'

export default function CreateDareForm() {
  const { account } = useWeb3()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: 7,
    proofType: 'video'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contract interaction
    console.log('Creating dare:', formData)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Dare Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., Sing in public"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Describe the challenge in detail..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-2">
            Reward (PYUSD)
          </label>
          <input
            type="number"
            id="reward"
            step="0.01"
            min="0.01"
            value={formData.reward}
            onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="10.00"
            required
          />
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Deadline (days)
          </label>
          <select
            id="deadline"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        <div>
          <label htmlFor="proofType" className="block text-sm font-medium text-gray-700 mb-2">
            Proof Required
          </label>
          <select
            id="proofType"
            value={formData.proofType}
            onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> The reward amount will be locked in the smart contract until the dare is completed or expires.
          You'll need to approve the PYUSD transfer before creating the dare.
        </p>
      </div>

      <button type="submit" className="btn-primary w-full">
        Create Dare
      </button>
    </form>
  )
}