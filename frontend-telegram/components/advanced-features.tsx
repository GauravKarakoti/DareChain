"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Flame, Calendar, Users, Star, Gift, Clock } from "lucide-react"

interface Challenge {
  id: number
  title: string
  description: string
  reward: number
  progress: number
  deadline: string
  participants: number
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
}

interface Achievement {
  id: number
  title: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
}

export function WeeklyChallenges() {
  const [challenges] = useState<Challenge[]>([
    {
      id: 1,
      title: "Kindness Streak",
      description: "Complete 5 acts of kindness this week",
      reward: 50,
      progress: 60,
      deadline: "3 days",
      participants: 234,
      difficulty: "Medium",
      category: "Social Good",
    },
    {
      id: 2,
      title: "Creative Explorer",
      description: "Try 3 different creative challenges",
      reward: 30,
      progress: 33,
      deadline: "5 days",
      participants: 156,
      difficulty: "Easy",
      category: "Creative",
    },
    {
      id: 3,
      title: "Social Butterfly",
      description: "Interact with 10 new people through dares",
      reward: 75,
      progress: 80,
      deadline: "2 days",
      participants: 89,
      difficulty: "Hard",
      category: "Social",
    },
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-balance">Weekly Challenges</h3>
        <Badge variant="secondary" className="gap-1">
          <Calendar className="w-3 h-3" />3 days left
        </Badge>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-balance">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground text-pretty">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {challenge.reward} TFIL
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{challenge.progress}%</span>
                  </div>
                  <Progress value={challenge.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {challenge.deadline}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {challenge.participants}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {challenge.difficulty}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AchievementSystem() {
  const [achievements] = useState<Achievement[]>([
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first dare",
      icon: "🎯",
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      rarity: "Common",
    },
    {
      id: 2,
      title: "Social Butterfly",
      description: "Complete 10 social dares",
      icon: "🦋",
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      rarity: "Rare",
    },
    {
      id: 3,
      title: "Streak Master",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      progress: 5,
      maxProgress: 7,
      unlocked: false,
      rarity: "Epic",
    },
    {
      id: 4,
      title: "Community Hero",
      description: "Help 50 people through voting",
      icon: "🦸",
      progress: 23,
      maxProgress: 50,
      unlocked: false,
      rarity: "Legendary",
    },
  ])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-600 border-gray-200"
      case "Rare":
        return "text-blue-600 border-blue-200"
      case "Epic":
        return "text-purple-600 border-purple-200"
      case "Legendary":
        return "text-yellow-600 border-yellow-200"
      default:
        return "text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-balance">Achievements</h3>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`relative overflow-hidden transition-all duration-200 hover:scale-105 ${
              achievement.unlocked ? "bg-primary/5 border-primary/20" : "opacity-75"
            }`}
          >
            <CardContent className="p-3 text-center space-y-2">
              <div className="text-2xl">{achievement.icon}</div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-balance">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground text-pretty">{achievement.description}</p>
              </div>

              {!achievement.unlocked && (
                <div className="space-y-1">
                  <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
                  <p className="text-xs text-muted-foreground">
                    {achievement.progress}/{achievement.maxProgress}
                  </p>
                </div>
              )}

              <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                {achievement.rarity}
              </Badge>

              {achievement.unlocked && (
                <div className="absolute top-1 right-1">
                  <Badge className="bg-green-600 text-white p-1">
                    <Star className="w-3 h-3" />
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function DailyRewards() {
  const [currentStreak, setCurrentStreak] = useState(5)
  const [todayClaimed, setTodayClaimed] = useState(false)

  const rewards = [
    { day: 1, reward: 5, claimed: true },
    { day: 2, reward: 10, claimed: true },
    { day: 3, reward: 15, claimed: true },
    { day: 4, reward: 20, claimed: true },
    { day: 5, reward: 25, claimed: true },
    { day: 6, reward: 50, claimed: false },
    { day: 7, reward: 100, claimed: false },
  ]

  const handleClaimReward = () => {
    setTodayClaimed(true)
    setCurrentStreak((prev) => prev + 1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Daily Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-bold">{currentStreak} Day Streak</span>
          </div>
          <p className="text-sm text-muted-foreground">Keep it up! Don't break the chain.</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {rewards.map((reward) => (
            <div
              key={reward.day}
              className={`text-center p-2 rounded-lg border transition-all duration-200 ${
                reward.claimed
                  ? "bg-green-50 border-green-200 dark:bg-green-950"
                  : reward.day === currentStreak + 1 && !todayClaimed
                    ? "bg-primary/10 border-primary/20 animate-pulse"
                    : "bg-muted/50 border-border"
              }`}
            >
              <div className="text-xs font-medium">Day {reward.day}</div>
              <div className="text-sm font-bold">{reward.reward}</div>
              <div className="text-xs text-muted-foreground">TFIL</div>
              {reward.claimed && (
                <div className="mt-1">
                  <Badge className="bg-green-600 text-white p-0.5">✓</Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {!todayClaimed && currentStreak < 7 && (
          <Button onClick={handleClaimReward} className="w-full transition-all duration-200 hover:scale-105">
            <Gift className="w-4 h-4 mr-2" />
            Claim Today's Reward ({rewards[currentStreak]?.reward} TFIL)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
