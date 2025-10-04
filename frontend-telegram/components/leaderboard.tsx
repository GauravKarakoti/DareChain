"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, TrendingUp, Zap } from "lucide-react"

interface LeaderboardUser {
  id: number
  name: string
  avatar: string
  score: number
  rank: number
  change: number
  completedDares: number
  successRate: number
  totalEarned: number
  streak: number
  badges: string[]
}

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState("weekly")
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { address } = useAccount()

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/leaderboard?timeframe=${timeframe}`)
        console.log("Fetched Leaderboard Data:", response.data)
        setLeaderboardData(response.data.data)
      } catch (error) {
        console.error(`Failed to fetch leaderboard data for timeframe ${timeframe}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeaderboardData()
  }, [timeframe])

  if (isLoading) {
    return <div>Loading...</div>
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{rank}</span>
    }
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="secondary" className="text-green-600 gap-1">
          ↗ {change}
        </Badge>
      )
    } else if (change < 0) {
      return (
        <Badge variant="secondary" className="text-red-600 gap-1">
          ↘ {Math.abs(change)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        —
      </Badge>
    )
  }

  const currentUserData = leaderboardData.find(user => user.name.toLowerCase() === address?.toLowerCase());
  console.log("Current User Data:", currentUserData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">Leaderboard</h2>
        <Tabs value={timeframe} onValueChange={setTimeframe}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Week</TabsTrigger>
            <TabsTrigger value="monthly">Month</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {leaderboardData.slice(0, 3).map((user, index) => (
          <Card key={user.id} className={`text-center ${index === 0 ? "ring-2 ring-yellow-500/20" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-center">{getRankIcon(user.rank)}</div>
              <Avatar className="w-12 h-12 mx-auto">
                {user.avatar && <AvatarImage src={`https://gateway.lighthouse.storage/ipfs/${user.avatar}`} alt={user.name} />}
                <AvatarFallback>{user.name.substring(2, 4).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm truncate">{user.name.slice(0, 6)}...{user.name.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">{user.score} pts</p>
              </div>
              <div className="flex justify-center">{getChangeIndicator(user.change)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaderboardData.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                user.name.toLowerCase() === address?.toLowerCase() ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
                <Avatar className="w-10 h-10">
                  {user.avatar && <AvatarImage src={`https://gateway.lighthouse.storage/ipfs/${user.avatar}`} alt={user.name} />}
                  <AvatarFallback>{user.name.substring(2, 4).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.name.toLowerCase() === address?.toLowerCase() ? 'You' : `${user.name.slice(0,6)}...${user.name.slice(-4)}`}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{user.completedDares} dares</span>
                    <span>{user.successRate}% success</span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {user.streak}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold">{user.score}</p>
                <div className="flex justify-end">{getChangeIndicator(user.change)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Your Stats */}
      {currentUserData && (
        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">${currentUserData.totalEarned}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{currentUserData.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}