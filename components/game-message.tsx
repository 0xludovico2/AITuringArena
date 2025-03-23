"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

interface GameMessageProps {
  sender: string
  content: string
  isYou?: boolean
}

export function GameMessage({ sender, content, isYou = false }: GameMessageProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Generate a consistent color based on the sender's name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ]

    // Simple hash function to get a consistent index
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div
      className={`flex ${isYou ? "justify-end" : "justify-start"} transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        transform: `translateY(${isVisible ? "0" : "10px"})`,
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
      }}
    >
      <div className={`flex max-w-[80%] ${isYou ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar
          className={`h-8 w-8 ${isYou ? "ml-2" : "mr-2"} shadow-sm hover:shadow-md transition-shadow duration-300`}
        >
          <AvatarFallback
            className={`${isYou ? "bg-gradient-to-br from-primary to-purple-700" : getAvatarColor(sender)}`}
          >
            {getInitials(sender)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className={`text-xs text-slate-400 mb-1 ${isYou ? "text-right" : "text-left"}`}>{sender}</div>
          <div
            className={`p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${
              isYou
                ? "bg-gradient-to-r from-primary to-purple-700 text-primary-foreground rounded-tr-none"
                : "bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-tl-none"
            }`}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}

