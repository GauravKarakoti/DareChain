'use client'

import { useWeb3 } from '@/components/providers/Web3Provider'
import Link from 'next/link'
import { Trophy, Shield, Users, Coins } from 'lucide-react'

export default function Home() {
  const { isConnected } = useWeb3()

  const features = [
    {
      icon: Shield,
      title: 'Privacy-Preserving',
      description: 'Verify your identity without revealing personal information using Self Protocol'
    },
    {
      icon: Trophy,
      title: 'Complete Challenges',
      description: 'Participate in fun dares and submit proof via Filecoin storage'
    },
    {
      icon: Coins,
      title: 'Earn Rewards',
      description: 'Get paid in PYUSD for completing dares and successful bets'
    },
    {
      icon: Users,
      title: 'Community Voting',
      description: 'Vote on dare completions and bet on outcomes'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              DareChain
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The decentralized truth-and-dare platform where you can participate in fun challenges, 
            preserve your privacy, and earn crypto rewards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isConnected ? (
            <>
              <Link href="/dares" className="btn-primary text-lg px-8 py-3">
                Explore Dares
              </Link>
              <Link href="/dares/create" className="btn-secondary text-lg px-8 py-3">
                Create Dare
              </Link>
            </>
          ) : (
            <p className="text-gray-600">Connect your wallet to get started!</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="card text-center space-y-4">
            <feature.icon className="h-12 w-12 text-primary-600 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* How It Works Section */}
      <section className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            'Connect your World App wallet and verify identity',
            'Browse or create dares with PYUSD rewards',
            'Submit proof, vote, and earn rewards'
          ].map((step, index) => (
            <div key={index} className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                {index + 1}
              </div>
              <p className="text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}