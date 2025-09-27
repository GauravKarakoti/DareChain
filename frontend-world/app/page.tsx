"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Shield, Plus, Trophy, Users, Bell, Zap, Medal } from "lucide-react"
import { DareMarketplace } from "@/components/dare-marketplace"
import { CreateDare } from "@/components/create-dare"
import { Profile } from "@/components/profile"
import { NotificationCenter } from "@/components/notification-center"
import { Leaderboard } from "@/components/leaderboard"
import { MobileStatusBar, ConnectionStatus, useHapticFeedback } from "@/components/enhanced-mobile-features"

export default function DareFiApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [activeTab, setActiveTab] = useState("marketplace")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "reward",
      message: "You earned 50 USDC from 'Coffee for Stranger' dare!",
      time: "2m ago",
      unread: true,
    },
    {
      id: 2,
      type: "vote",
      message: "Your submission is being voted on by the community",
      time: "1h ago",
      unread: true,
    },
    { id: 3, type: "dare", message: "New dare available: 'Random Act of Kindness'", time: "3h ago", unread: false },
  ])

  const { vibrate } = useHapticFeedback()

  const handleAuth = () => {
    setIsAuthenticated(true)
    // Simulate verification process with realistic timing
    setTimeout(() => setIsVerified(true), 2000)
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleTabChange = (tab: string) => {
    vibrate(25)
    setActiveTab(tab)
  }

  if (!isAuthenticated) {
    return <OnboardingScreen onAuth={handleAuth} />
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileStatusBar />

      <ConnectionStatus />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-balance">DareFi</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative transition-all duration-200 hover:scale-110"
              onClick={() => {
                vibrate(50)
                setShowNotifications(!showNotifications)
              }}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs animate-pulse">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            {isVerified && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            )}
            <Avatar className="w-8 h-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={markAllAsRead}
        />
      )}

      {/* Main Content */}
      <main className="pb-20">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="marketplace" className="mt-0">
            <DareMarketplace />
          </TabsContent>
          <TabsContent value="create" className="mt-0">
            <CreateDare />
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-0">
            <Leaderboard />
          </TabsContent>
          <TabsContent value="profile" className="mt-0">
            <Profile />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around p-4">
          <Button
            variant={activeTab === "marketplace" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("marketplace")}
            className="flex-col gap-1 h-auto py-2 transition-all duration-200 hover:scale-105"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-xs">Dares</span>
          </Button>
          <Button
            variant={activeTab === "create" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("create")}
            className="flex-col gap-1 h-auto py-2 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">Create</span>
          </Button>
          <Button
            variant={activeTab === "leaderboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("leaderboard")}
            className="flex-col gap-1 h-auto py-2 transition-all duration-200 hover:scale-105"
          >
            <Medal className="w-4 h-4" />
            <span className="text-xs">Rankings</span>
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("profile")}
            className="flex-col gap-1 h-auto py-2 transition-all duration-200 hover:scale-105"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}

function OnboardingScreen({ onAuth }: { onAuth: () => void }) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      onAuth()
      setIsConnecting(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Welcome to DareFi</h1>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Create, accept, and prove dares with crypto rewards. Join the community of verified challengers.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>Connect with World App for secure authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleConnect} className="w-full" size="lg" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Connect World App
                </>
              )}
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Secure • Verified • Decentralized</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Earn Rewards</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Verified Proof</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Community</p>
          </div>
        </div>
      </div>
    </div>
  )
}
