"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Shield,
  Star,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Vote,
  Settings,
  Share,
} from "lucide-react"

interface UserStats {
  daresCompleted: number
  daresCreated: number
  totalEarned: number
  votingAccuracy: number
  currentStreak: number
  longestStreak: number
  rank: number
  totalUsers: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  maxProgress?: number
}

interface Activity {
  id: string
  type: "completed" | "created" | "voted" | "won" | "failed"
  title: string
  description: string
  reward?: number
  timestamp: string
  status: "success" | "pending" | "failed"
}

const mockUserStats: UserStats = {
  daresCompleted: 12,
  daresCreated: 3,
  totalEarned: 45.5,
  votingAccuracy: 87,
  currentStreak: 5,
  longestStreak: 8,
  rank: 156,
  totalUsers: 2847,
}

const mockAchievements: Achievement[] = [
  {
    id: "first-dare",
    title: "First Steps",
    description: "Complete your first dare",
    icon: "🎯",
    unlocked: true,
    unlockedAt: "2 weeks ago",
  },
  {
    id: "streak-5",
    title: "On Fire",
    description: "Complete 5 dares in a row",
    icon: "🔥",
    unlocked: true,
    unlockedAt: "1 week ago",
  },
  {
    id: "creator",
    title: "Dare Creator",
    description: "Create your first dare",
    icon: "✨",
    unlocked: true,
    unlockedAt: "5 days ago",
  },
  {
    id: "voter",
    title: "Community Voice",
    description: "Vote on 50 submissions",
    icon: "🗳️",
    unlocked: false,
    progress: 23,
    maxProgress: 50,
  },
  {
    id: "streak-10",
    title: "Unstoppable",
    description: "Complete 10 dares in a row",
    icon: "⚡",
    unlocked: false,
    progress: 5,
    maxProgress: 10,
  },
  {
    id: "big-winner",
    title: "Big Winner",
    description: "Win a dare worth 20+ USDC",
    icon: "💎",
    unlocked: false,
  },
]

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "completed",
    title: "Dance challenge",
    description: "Completed 'Dance for 30 seconds in public'",
    reward: 5,
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: "2",
    type: "voted",
    title: "Community voting",
    description: "Voted on 'Random act of kindness' submissions",
    reward: 0.5,
    timestamp: "4 hours ago",
    status: "success",
  },
  {
    id: "3",
    type: "created",
    title: "New dare created",
    description: "Created 'Learn a magic trick'",
    reward: 0,
    timestamp: "1 day ago",
    status: "pending",
  },
  {
    id: "4",
    type: "won",
    title: "Dare winner",
    description: "Won 'Compliment strangers' dare",
    reward: 8,
    timestamp: "2 days ago",
    status: "success",
  },
  {
    id: "5",
    type: "failed",
    title: "Submission rejected",
    description: "Submission for 'Public speaking' was not approved",
    timestamp: "3 days ago",
    status: "failed",
  },
  {
    id: "6",
    type: "completed",
    title: "Art challenge",
    description: "Completed 'Create art with recycled materials'",
    reward: 8,
    timestamp: "5 days ago",
    status: "success",
  },
]

export function Profile() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-4 space-y-6">
        <div className="text-center space-y-4">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarFallback className="text-3xl">U</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your Profile</h2>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                Verified Human
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Trophy className="w-3 h-3" />
                Rank #{mockUserStats.rank}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{mockUserStats.daresCompleted}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-secondary">{mockUserStats.totalEarned}</div>
            <div className="text-sm text-muted-foreground">USDC Earned</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-accent">{mockUserStats.daresCreated}</div>
            <div className="text-sm text-muted-foreground">Created</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <Share className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mx-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ProfileOverview stats={mockUserStats} />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Achievements achievements={mockAchievements} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityHistory activities={mockActivities} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileOverview({ stats }: { stats: UserStats }) {
  const rankPercentile = Math.round(((stats.totalUsers - stats.rank) / stats.totalUsers) * 100)

  return (
    <div className="p-4 space-y-6">
      {/* Detailed Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-balance">Performance Stats</h3>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Community Rank</div>
                <div className="text-2xl font-bold">#{stats.rank}</div>
                <div className="text-xs text-muted-foreground">Top {rankPercentile}% of users</div>
              </div>
              <div className="text-right">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-secondary">{stats.votingAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Voting Accuracy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-accent">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Streak Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Streak Progress
            </CardTitle>
            <CardDescription>Keep completing dares to maintain your streak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Current: {stats.currentStreak} dares</span>
              <span>Best: {stats.longestStreak} dares</span>
            </div>
            <Progress value={(stats.currentStreak / stats.longestStreak) * 100} className="w-full" />
            <div className="text-xs text-muted-foreground text-center">
              {stats.longestStreak - stats.currentStreak} more to beat your record!
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Highlights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-balance">Recent Highlights</h3>
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Won Dance Challenge</div>
                <div className="text-sm text-muted-foreground">Earned 5 USDC • 2 hours ago</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Achievement Unlocked</div>
                <div className="text-sm text-muted-foreground">"On Fire" - 5 dare streak • 1 week ago</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Achievements({ achievements }: { achievements: Achievement[] }) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-balance">Achievements</h3>
        <div className="flex items-center gap-2">
          <Progress value={(unlockedCount / totalCount) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`${achievement.unlocked ? "border-primary/20 bg-primary/5" : "opacity-75"}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{achievement.title}</h4>
                    {achievement.unlocked && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked ? (
                    <div className="text-xs text-muted-foreground">Unlocked {achievement.unlockedAt}</div>
                  ) : achievement.progress !== undefined ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <Progress
                        value={((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}
                        className="w-full h-2"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Locked</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ActivityHistory({ activities }: { activities: Activity[] }) {
  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "created":
        return <Trophy className="w-4 h-4 text-blue-500" />
      case "voted":
        return <Vote className="w-4 h-4 text-purple-500" />
      case "won":
        return <Award className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
      default:
        return null
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-balance">Activity History</h3>
        <p className="text-muted-foreground text-sm">Your recent dare activities and earnings</p>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getActivityIcon(activity.type, activity.status)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-balance">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(activity.status)}
                      {activity.reward && activity.reward > 0 && (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{activity.reward} USDC
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center py-4">
        <Button variant="outline" className="bg-transparent">
          Load More Activity
        </Button>
      </div>
    </div>
  )
}
