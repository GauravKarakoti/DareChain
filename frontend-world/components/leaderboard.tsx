"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

  const leaderboardData: LeaderboardUser[] = [
    {
      id: 1,
      name: "Sarah Kim",
      avatar: "SK",
      score: 2450,
      rank: 1,
      change: 2,
      completedDares: 23,
      successRate: 95,
      totalEarned: 1250,
      streak: 12,
      badges: ["Top Creator", "Community Hero", "Streak Master"],
    },
    {
      id: 2,
      name: "Alex Chen",
      avatar: "AC",
      score: 2380,
      rank: 2,
      change: -1,
      completedDares: 19,
      successRate: 89,
      totalEarned: 980,
      streak: 8,
      badges: ["Verified Pro", "Rising Star"],
    },
    {
      id: 3,
      name: "Mike Johnson",
      avatar: "MJ",
      score: 2290,
      rank: 3,
      change: 1,
      completedDares: 21,
      successRate: 92,
      totalEarned: 1100,
      streak: 5,
      badges: ["Dare Master", "Community Choice"],
    },
    {
      id: 4,
      name: "Emma Wilson",
      avatar: "EW",
      score: 2150,
      rank: 4,
      change: 0,
      completedDares: 17,
      successRate: 88,
      totalEarned: 850,
      streak: 15,
      badges: ["Consistency King", "Photo Pro"],
    },
    {
      id: 5,
      name: "You",
      avatar: "YU",
      score: 1890,
      rank: 8,
      change: 3,
      completedDares: 14,
      successRate: 85,
      totalEarned: 720,
      streak: 6,
      badges: ["Rising Star", "First Timer"],
    },
  ]

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
                <AvatarFallback>{user.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
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
                user.name === "You" ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{user.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    {user.name === "You" && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
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
      <Card>
        <CardHeader>
          <CardTitle>Your Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">$720</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">85%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
