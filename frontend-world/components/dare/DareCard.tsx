'use client'

import { Dare } from '@/lib/types'
import Link from 'next/link'
import { Clock, Users, Trophy, Video } from 'lucide-react'

interface DareCardProps {
  dare: Dare
}

export default function DareCard({ dare }: DareCardProps) {
  const timeLeft = dare.deadline - Date.now()
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{dare.title}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{dare.description}</p>
          </div>
          <div className="flex items-center space-x-1 text-yellow-600">
            <Trophy className="h-4 w-4" />
            <span className="font-medium">{dare.reward} PYUSD</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{daysLeft}d left</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{dare.participants}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Video className="h-4 w-4" />
              <span className="capitalize">{dare.proofRequired}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link 
            href={`/dares/${dare.id}`}
            className="btn-primary flex-1 text-center"
          >
            View Dare
          </Link>
        </div>
      </div>
    </div>
  )
}