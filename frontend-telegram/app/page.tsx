"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Shield, Plus, Trophy, Users, Bell, Medal, Zap, Loader2 } from "lucide-react"
import { DareMarketplace } from "@/components/dare-marketplace"
import { CreateDare } from "@/components/create-dare"
import { Profile } from "@/components/profile"
import { NotificationCenter } from "@/components/notification-center"
import { Leaderboard } from "@/components/leaderboard"
import { ConnectionStatus, useHapticFeedback } from "@/components/enhanced-mobile-features"

interface Notification {
  id: number;
  type: "reward" | "vote" | "dare" | "system";
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function DareXApp() {
  const { isConnected, address } = useAccount()
  const [activeTab, setActiveTab] = useState("marketplace")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  const { vibrate } = useHapticFeedback()
  
  useEffect(() => {
    const findOrCreateUser = async (walletAddress: string) => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/findOrCreate`, {
                walletAddress: walletAddress
            });
            console.log("User session initialized successfully.");
            fetchNotifications(response.data.userId);
        } catch (error) {
            console.error("Failed to initialize user session:", error);
        }
    };

    if (isConnected && address) {
        findOrCreateUser(address);
    }
  }, [isConnected, address]);

  const fetchNotifications = async (userId: number) => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${userId}`);
        setNotifications(response.data.data);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    }
  };

  const isVerified = isConnected 

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllAsRead = async () => {
    if (!address) return;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/mark-all-read`, {
        walletAddress: address,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    vibrate(25)
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus />

      {/* Header (omitted for brevity) */}
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
            
            {/* Connect button when disconnected (Header) */}
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
          {/* Updated card with loading state logic and cursor-pointer */}
          <div 
            className={`p-8 rounded-2xl border border-primary/30 shadow-2xl bg-card/70 backdrop-blur-sm max-w-sm w-full transition-all duration-500 hover:shadow-primary/50 ${
              isConnecting ? 'opacity-70 pointer-events-none' : 'cursor-pointer'
            }`}
            // Optional: Add an onClick to the parent div for a larger clickable area 
            // and to trigger the visual loading state.
            onClick={() => {
              if (!isConnecting) {
                // This provides visual feedback right as the user initiates the connection flow
                setIsConnecting(true) 
                // The state will reset when the wallet connection resolves (which will change isConnected)
              }
            }}
          >
            {isConnecting ? (
              // Loading state content
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Opening wallet connector...</p>
              </div>
            ) : (
              // Initial content
              <>
                <Zap className="w-10 h-10 text-primary mb-4 mx-auto animate-pulse" />
                <h2 className="text-2xl font-extrabold mb-2 text-foreground">
                  Jump into DareX
                </h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  Connect your crypto wallet to start accepting challenges, earning rewards, and climbing the leaderboard.
                </p>
                {/* The ConnectButton */}
                <ConnectButton 
                  accountStatus="full" 
                  chainStatus="icon" 
                  showBalance={true} 
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}