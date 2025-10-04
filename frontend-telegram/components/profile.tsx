"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Camera,
  Loader2,
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
  avatar?: string
  displayName: string
  bio?: string
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

export function Profile() {
  const [activeTab, setActiveTab] = useState("overview")
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareText, setShareText] = useState("Share Profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address } = useAccount()
  const router = useRouter()

  const fetchProfileData = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const [statsRes, achievementsRes, activitiesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/${address}`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/achievements`, {
          params: { walletAddress: address },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/activities`, {
          params: { walletAddress: address },
        }),
      ]);
      setUserStats(statsRes.data.data);
      setAchievements(achievementsRes.data.data);
      setActivities(activitiesRes.data.data);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData()
  }, [address])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload-single', formData, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total ?? file.size;
          const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percentCompleted);
        },
      });
      const { cid } = response.data;
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/avatar`, {
        walletAddress: address,
        avatarCid: cid,
      });
      await fetchProfileData(); // Refetch profile data to show the new avatar
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    const shareData = {
        title: "Check out my DareX Profile!",
        text: `See my stats and achievements for wallet ${address?.slice(0, 6)}...${address?.slice(-4)} on DareX.`,
        url: profileUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error("Error sharing profile:", error);
        }
    } else {
        // Fallback for browsers that don't support Web Share API
        try {
            await navigator.clipboard.writeText(profileUrl);
            setShareText("Copied!");
            setTimeout(() => {
                setShareText("Share Profile");
            }, 2000);
        } catch (error) {
            console.error("Failed to copy profile URL:", error);
            alert("Failed to copy URL.");
        }
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>
  }

  if (!userStats) {
    return <div>Could not load profile data.</div>
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-4 space-y-6">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto group">
            <Avatar className="w-24 h-24">
              {userStats.avatar && <AvatarImage src={`https://gateway.lighthouse.storage/ipfs/${userStats.avatar}`} alt="User Avatar" />}
              <AvatarFallback className="text-3xl">
                {address?.substring(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 group-hover:bg-primary group-hover:text-primary-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{userStats.displayName ? userStats.displayName : `${address?.slice(0, 6)}...${address?.slice(-4)}`}</h2>
            {userStats.bio && <p className="text-sm text-muted-foreground">{userStats.bio}</p>}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                Verified Human
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Trophy className="w-3 h-3" />
                Rank #{userStats.rank}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{userStats.daresCompleted}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-secondary">{userStats.totalEarned}</div>
            <div className="text-sm text-muted-foreground">TFIL Earned</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-accent">{userStats.daresCreated}</div>
            <div className="text-sm text-muted-foreground">Created</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 bg-transparent"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-transparent"
            onClick={handleShareProfile}
          >
            <Share className="w-4 h-4 mr-2" />
            {shareText}
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
          <ProfileOverview stats={userStats} activities={activities} />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Achievements achievements={achievements} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityHistory activities={activities} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileOverview({ stats, activities }: { stats: UserStats, activities: Activity[] }) {
  const rankPercentile = stats.totalUsers > 0 ? Math.round(((stats.totalUsers - stats.rank) / stats.totalUsers) * 100) : 0;
  const recentActivities = activities.slice(0, 2);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "completed":
      case "won":
        return <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case "created":
        return <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

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
            <Progress value={stats.longestStreak > 0 ? (stats.currentStreak / stats.longestStreak) * 100 : 0} className="w-full" />
            <div className="text-xs text-muted-foreground text-center">
              {stats.longestStreak > stats.currentStreak
                ? `${stats.longestStreak - stats.currentStreak} more to beat your record!`
                : "New record!"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Highlights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-balance">Recent Highlights</h3>
        <div className="space-y-3">
          {recentActivities.map(activity => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${activity.type === 'won' || activity.type === 'completed' ? 'green' : 'blue'}-100 dark:bg-${activity.type === 'won' || activity.type === 'completed' ? 'green' : 'blue'}-900 rounded-full flex items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.description}
                    {activity.reward ? ` • Earned ${activity.reward} TFIL` : ''} • {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(activity.status)}
                      {activity.reward && activity.reward > 0 && (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{activity.reward} TFIL
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