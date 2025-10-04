"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import axios from 'axios'
import { useAccount } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, Heart, Reply, AlertCircle } from "lucide-react"
import { useHapticFeedback } from "@/components/enhanced-mobile-features"
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: number;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replyingTo?: {
      user: string;
      message: string;
  };
}

interface DareChatProps {
  dareId: number
  dareTitle: string
  onClose: () => void
}

export function DareChat({ dareId, dareTitle, onClose }: DareChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { vibrate } = useHapticFeedback()
  const { address } = useAccount();

  const fetchComments = useCallback(async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares/${dareId}/comments`, {
            params: { walletAddress: address }
        });
        const formattedMessages = response.data.data.map((comment: any) => ({
            id: comment.id,
            user: comment.user,
            avatar: comment.user.substring(2, 4).toUpperCase(),
            message: comment.comment,
            timestamp: formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }),
            likes: comment.likes,
            isLiked: comment.isLiked,
            replyingTo: comment.repliedTo_comment ? { user: comment.repliedTo_user, message: comment.repliedTo_comment } : undefined
        }));
        setMessages(formattedMessages);
    } catch (err) {
        setError('Failed to load comments.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [dareId, address]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !address) return

    vibrate(25)
    
    const optimisticMessage: Message = {
      id: Date.now(),
      user: address,
      avatar: 'YOU',
      message: newMessage,
      timestamp: "sending...",
      likes: 0,
      isLiked: false,
      replyingTo: replyingTo ? {
          user: messages.find(m => m.id === replyingTo)?.user || 'unknown',
          message: messages.find(m => m.id === replyingTo)?.message || ''
      } : undefined
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyingTo(null);

    try {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares/${dareId}/comment`, {
            walletAddress: address,
            comment: newMessage,
            replyingTo: replyingTo
        });
        await fetchComments();
    } catch (error) {
        console.error("Failed to send message:", error);
        setError("Could not send your message. Please try again.");
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  }

  const handleLikeMessage = async (messageId: number) => {
    if (!address) return;
    vibrate(50);

    const originalMessages = [...messages];
    const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
            return {
                ...msg,
                isLiked: !msg.isLiked,
                likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1,
            };
        }
        return msg;
    });
    setMessages(updatedMessages);

    try {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comments/${messageId}/like`, {
            walletAddress: address
        });
    } catch (error) {
        console.error("Failed to like message:", error);
        setMessages(originalMessages);
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
            <p className="text-center text-muted-foreground">Loading comments...</p>
        ) : error ? (
            <p className="text-center text-destructive">{error}</p>
        ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No comments yet. Be the first!</p>
        ) : (
            messages.map((message) => (
                <div key={message.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">{message.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{message.user === address ? 'You' : `${message.user.slice(0, 6)}...${message.user.slice(-4)}`}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        {message.replyingTo && (
                            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md mb-2">
                                Replying to <strong>{message.replyingTo.user.slice(0, 6)}...{message.replyingTo.user.slice(-4)}</strong>: "<i>{message.replyingTo.message.slice(0, 50)}...</i>"
                            </div>
                        )}
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
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Replying to {messages.find((m) => m.id === replyingTo)?.user.slice(0, 8)}...
            </span>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              ×
            </Button>
          </div>
        </div>
      )}

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