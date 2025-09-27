"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wifi, WifiOff, Battery } from "lucide-react"

export function MobileStatusBar() {
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState(85)
  const [signalStrength, setSignalStrength] = useState(4)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>9:41</span>
      </div>
      <div className="flex items-center gap-1">
        {isOnline ? <Wifi className="w-3 h-3 text-muted-foreground" /> : <WifiOff className="w-3 h-3 text-red-500" />}
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-2 rounded-sm ${i < signalStrength ? "bg-muted-foreground" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Battery className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  )
}

export function useHapticFeedback() {
  const vibrate = (pattern: number | number[] = 50) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
    } else {
      // Fallback visual feedback
      document.body.style.transform = "scale(0.99)"
      setTimeout(() => {
        document.body.style.transform = "scale(1)"
      }, 50)
    }
  }

  return { vibrate }
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = "",
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const threshold = 100
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }

    setCurrentX(0)
    setIsDragging(false)
  }

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ${className}`}
      style={{ transform: `translateX(${currentX}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

export function DareCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
        <div className="h-16 bg-muted rounded"></div>
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
            <div className="h-3 bg-muted rounded w-8"></div>
          </div>
          <div className="h-5 bg-muted rounded w-16"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded flex-1"></div>
          <div className="h-9 bg-muted rounded w-9"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div
      className={`fixed top-20 left-4 right-4 z-50 transition-all duration-300 ${showStatus ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
    >
      <Card
        className={`${isOnline ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Back online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">No internet connection</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
