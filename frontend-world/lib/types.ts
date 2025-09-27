export interface Dare {
  id: number
  title: string
  description: string
  creator: string
  reward: string
  deadline: number
  completed: boolean
  participants: number
  proofRequired: 'photo' | 'video'
  proof?: string // Filecoin CID
}

export interface Bet {
  id: number
  dareId: number
  better: string
  amount: string
  vote: boolean // true = success, false = fail
  claimed: boolean
}

export interface User {
  address: string
  identityVerified: boolean
  completedDares: number
  totalEarnings: string
  reputation: number
}