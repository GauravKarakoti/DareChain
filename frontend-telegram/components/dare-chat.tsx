"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, Heart, Reply } from "lucide-react"
import { useHapticFeedback } from "@/components/enhanced-mobile-features"

interface Message {
  id: number
  user: string
  avatar: string
  message: string
  timestamp: string
  likes: number
  isLiked: boolean
  replies?: Message[]
  isCreator?: boolean
  isVerified?: boolean
}

interface DareChatProps {
  dareId: number
  dareTitle: string
  onClose: () => void
}

export function DareChat({ dareId, dareTitle, onClose }: DareChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "Alex Chen",
      avatar: "AC",
      message: "This looks like a fun challenge! Anyone have tips for approaching strangers?",
      timestamp: "2m ago",
      likes: 3,
      isLiked: false,
      isVerified: true,
    },
    {
      id: 2,
      user: "Sarah Kim",
      avatar: "SK",
      message: "I did something similar last week. Just be genuine and smile! Most people appreciate the kindness.",
      timestamp: "5m ago",
      likes: 7,
      isLiked: true,
      isCreator: true,
    },
    {
      id: 3,
      user: "Mike Johnson",
      avatar: "MJ",
      message: "Make sure to get clear photos for proof! The community voting can be strict.",
      timestamp: "8m ago",
      likes: 2,
      isLiked: false,
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { vibrate } = useHapticFeedback()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: messages.length + 1,
      user: "You",
      avatar: "YU",
      message: newMessage,
      timestamp: "now",
      likes: 0,
      isLiked: false,
    }

    setMessages([...messages, message])
    setNewMessage("")
    setReplyingTo(null)
    vibrate(25)
  }

  const handleLikeMessage = (messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isLiked: !msg.isLiked,
              likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1,
            }
          : msg,
      ),
    )
    vibrate(50)
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ←
          </Button>
          <div>
            <h2 className="font-semibold text-sm text-balance">{dareTitle}</h2>
            <p className="text-xs text-muted-foreground">Discussion</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <MessageCircle className="w-3 h-3" />
          {messages.length}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs">{message.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{message.user}</span>
                  {message.isCreator && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Creator
                    </Badge>
                  )}
                  {message.isVerified && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      ✓
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-sm text-pretty">{message.message}</p>
                  </CardContent>
                </Card>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-auto p-1 gap-1 ${message.isLiked ? "text-red-500" : ""}`}
                    onClick={() => handleLikeMessage(message.id)}
                  >
                    <Heart className={`w-3 h-3 ${message.isLiked ? "fill-current" : ""}`} />
                    <span className="text-xs">{message.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 gap-1"
                    onClick={() => setReplyingTo(message.id)}
                  >
                    <Reply className="w-3 h-3" />
                    <span className="text-xs">Reply</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Replying to {messages.find((m) => m.id === replyingTo)?.user}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="transition-all duration-200 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
