"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Trophy, Vote, Zap, CheckCheck } from "lucide-react"

interface Notification {
  id: number
  type: "reward" | "vote" | "dare" | "system"
  message: string
  createdAt: string
  isRead: boolean
}

interface NotificationCenterProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAllRead: () => void
}

export function NotificationCenter({ notifications, onClose, onMarkAllRead }: NotificationCenterProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "reward":
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case "vote":
        return <Vote className="w-4 h-4 text-blue-500" />
      case "dare":
        return <Zap className="w-4 h-4 text-purple-500" />
      default:
        return <CheckCheck className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <div className="absolute top-16 right-4 w-80 z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Notifications</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notifications yet</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  !notification.isRead ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleTimeString()}</span>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}