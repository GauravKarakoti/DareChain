"use client"

import { useState } from "react"
// Import Wagmi hook and RainbowKit component
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Shield, Plus, Trophy, Users, Bell, Medal, Zap } from "lucide-react"
import { DareMarketplace } from "@/components/dare-marketplace"
import { CreateDare } from "@/components/create-dare"
import { Profile } from "@/components/profile"
import { NotificationCenter } from "@/components/notification-center"
import { Leaderboard } from "@/components/leaderboard"
import { ConnectionStatus, useHapticFeedback } from "@/components/enhanced-mobile-features"

export default function DareXApp() {
  const { isConnected, address } = useAccount() // Use the actual connection status
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

  // NOTE: Assuming isVerified is tied to a separate check (e.g., World ID) and not just wallet connection.
  // For now, we'll keep it simple: if connected, assume verified for feature display.
  const isVerified = isConnected 

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleTabChange = (tab: string) => {
    vibrate(25)
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-balance">DareX</h1>
          </div>
          <div className="flex items-center gap-2">
            
            {/* Conditional display for notifications and verified badge */}
            {isConnected && (
              <>
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
                {/* The ConnectButton component handles the Avatar/Address display */}
                <ConnectButton 
                  accountStatus="avatar" 
                  chainStatus="none" 
                  showBalance={false} 
                />
              </>
            )}
            
            {/* Connect button when disconnected */}
            {!isConnected && (
              <ConnectButton 
                accountStatus="avatar" 
                chainStatus="none" 
                showBalance={false} 
              />
            )}
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

      {/* Main Content: Only show if wallet is connected */}
      {isConnected ? (
        <>
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

          {/* Bottom Navigation: Only show if wallet is connected */}
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-6 text-center">
          <Zap className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Log in to DareX with your crypto wallet to start playing, voting, and claiming rewards.
          </p>
          {/* A large ConnectButton for the center of the screen */}
          <ConnectButton 
            accountStatus="full" 
            chainStatus="icon" 
            showBalance={true} 
          />
        </div>
      )}
    </div>
  )
}