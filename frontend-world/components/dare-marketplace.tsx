"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Clock,
  Users,
  Camera,
  Vote,
  Search,
  Filter,
  Star,
  MapPin,
  RefreshCw,
  Zap,
  MessageCircle,
  Heart,
  Share2,
} from "lucide-react"
import { ProofSubmission } from "./proof-submission"
import { VotingSystem } from "./voting-system"
import { DareChat } from "./dare-chat"
import { useHapticFeedback, DareCardSkeleton } from "./enhanced-mobile-features"

interface Dare {
  id: number
  title: string
  description: string
  reward: number
  creator: string
  deadline: string
  difficulty: "Easy" | "Medium" | "Hard"
  participants: number
  status: "active" | "voting" | "completed"
  category: string
  location?: string
  featured?: boolean
  likes?: number
  comments?: number
}

export function DareMarketplace() {
  const [dares, setDares] = useState<Dare[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [isLoading, setIsLoading] = useState(true) // Set initial loading to true
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const categories = ["all", "Performance", "Learning", "Social Good", "Creative", "Adventure"]
  const difficulties = ["all", "Easy", "Medium", "Hard"]

  const fetchDares = async () => {
    // Don't set loading to true on refresh, use isRefreshing instead
    if (!isRefreshing) setIsLoading(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares`)
      setDares(response.data.data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch dares:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDares()
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDares()
    setIsRefreshing(false)
  }

  const filteredDares = dares.filter((dare) => {
    const matchesSearch =
      dare.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dare.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || dare.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || dare.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const featuredDares = filteredDares.filter((dare) => dare.featured)
  const activeDares = filteredDares.filter((dare) => dare.status === "active" && !dare.featured)
  const votingDares = filteredDares.filter((dare) => dare.status === "voting")

  return (
    <div className="space-y-6">
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-balance">Dare Marketplace</h2>
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dares..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="whitespace-nowrap transition-all duration-200 hover:scale-105"
          >
            All Categories
          </Button>
          {categories.slice(1).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap transition-all duration-200 hover:scale-105"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Filter className="w-4 h-4 text-muted-foreground mt-1" />
          <div className="flex gap-2 overflow-x-auto">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty}
                variant={selectedDifficulty === difficulty ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedDifficulty(difficulty)}
                className="whitespace-nowrap text-xs transition-all duration-200 hover:scale-110"
              >
                {difficulty === "all" ? "All Levels" : difficulty}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-4">
          <DareCardSkeleton />
          <DareCardSkeleton />
          <DareCardSkeleton />
        </div>
      ) : (
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="featured" className="transition-all duration-200">
              Featured
            </TabsTrigger>
            <TabsTrigger value="active" className="transition-all duration-200">
              Active
            </TabsTrigger>
            <TabsTrigger value="voting" className="transition-all duration-200">
              Voting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-4">
            <DareList dares={featuredDares} title="Featured Dares" />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <DareList dares={activeDares} title="Active Dares" />
          </TabsContent>

          <TabsContent value="voting" className="mt-4">
            <DareList dares={votingDares} title="Community Voting" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function DareList({ dares, title }: { dares: Dare[]; title: string }) {
  if (dares.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No dares found matching your criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-balance">{title}</h3>
      <div className="space-y-4">
        {dares.map((dare, index) => (
          <DareCard key={dare.id} dare={dare} index={index} />
        ))}
      </div>
    </div>
  )
}

function DareCard({ dare, index }: { dare: Dare; index: number }) {
  const [showProofSubmission, setShowProofSubmission] = useState(false)
  const [showVoting, setShowVoting] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(dare.likes || 0)
  const [commentCount, setCommentCount] = useState(dare.comments || 0)
  const { vibrate } = useHapticFeedback()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleAcceptDare = async () => {
    setIsAccepting(true)
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares/${dare.id}/accept`)
      setIsAccepted(true)
    } catch (error) {
      console.error("Failed to accept dare:", error)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    vibrate(25)
    // In a real app, you would also make an API call here to update the like status
    // axios.post(`http://localhost:3001/api/dares/${dare.id}/like`);
  }

  const handleShare = async () => {
    vibrate(50)
    if (navigator.share) {
      try {
        await navigator.share({
          title: dare.title,
          text: dare.description,
          url: `https://darex.app/dare/${dare.id}`,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(`Check out this dare: ${dare.title} - https://darex.app/dare/${dare.id}`)
    }
  }

  if (showProofSubmission) {
    return <ProofSubmission dareId={dare.id} />
  }

  if (showVoting) {
    return <VotingSystem dareId={dare.id} />
  }

  if (showChat) {
    return <DareChat dareId={dare.id} dareTitle={dare.title} onClose={() => setShowChat(false)} />
  }

  return (
    <Card
      className={`overflow-hidden relative transition-all duration-300 hover:shadow-lg ${isAccepted ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {dare.featured && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-secondary text-secondary-foreground gap-1 animate-pulse">
            <Star className="w-3 h-3" />
            Featured
          </Badge>
        </div>
      )}

      {isAccepted && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-green-600 text-white gap-1">
            <Zap className="w-3 h-3" />
            Accepted
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg leading-tight text-balance pr-16">{dare.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>by {dare.creator}</span>
                <Badge variant="outline" className="text-xs">
                  {dare.category}
                </Badge>
              </div>
            </div>
          </div>
          <CardDescription className="text-pretty leading-relaxed">{dare.description}</CardDescription>
          {dare.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{dare.location}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-secondary" />
              <span className="font-medium">{dare.reward} USDC</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{dare.deadline}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{dare.participants}</span>
            </div>
          </div>
          <Badge className={getDifficultyColor(dare.difficulty)}>{dare.difficulty}</Badge>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-border/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-auto p-1 gap-1 transition-all duration-200 hover:scale-110 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-xs">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 gap-1 transition-all duration-200 hover:scale-110"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{commentCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 gap-1 transition-all duration-200 hover:scale-110"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {dare.status === "voting" ? (
            <Button
              variant="secondary"
              className="flex-1 transition-all duration-200 hover:scale-105"
              onClick={() => setShowVoting(true)}
            >
              <Vote className="w-4 h-4 mr-2" />
              Vote on Submissions
            </Button>
          ) : (
            <>
              <Button
                className="flex-1 transition-all duration-200 hover:scale-105"
                onClick={handleAcceptDare}
                disabled={isAccepting || isAccepted}
              >
                {isAccepting ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : isAccepted ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Accepted!
                  </>
                ) : (
                  "Accept Dare"
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowProofSubmission(true)}
                className="transition-all duration-200 hover:scale-110"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}