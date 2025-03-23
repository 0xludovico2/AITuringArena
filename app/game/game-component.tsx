"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Clock, Send, AlertCircle, Info, Sparkles, Bot, User, MessageSquare } from "lucide-react"
import { GameMessage } from "@/components/game-message"
import { VotingModal } from "@/components/voting-modal"
import { SiteHeader } from "@/components/site-header"
import { useWeb3 } from "@/components/web3-provider"
import type { ChatMessage } from "@/lib/ai-service"
import { getRandomPersonality } from "@/lib/ai-personalities"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Footer } from "@/components/footer"

const CHAT_DURATION = 30 // 30 seconds for chatting (reduced for testing)
const VOTING_DURATION = 30 // 30 seconds for voting
const TOTAL_PLAYERS = 10 // Siempre tener 10 jugadores en total

// Función para generar nombres de jugadores
const generatePlayerName = (index: number) => `Player ${index + 1}`

export function GameComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, contract } = useWeb3()

  const gameId = searchParams.get("gameId")
  const [phase, setPhase] = useState<"chat" | "voting">("chat")
  const [timeLeft, setTimeLeft] = useState(CHAT_DURATION)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<
    Array<{ id: number; sender: string; content: string; isAI?: boolean; isYou?: boolean }>
  >([])
  const [messageCount, setMessageCount] = useState(0)
  const [players, setPlayers] = useState<string[]>([])
  const [playerNames, setPlayerNames] = useState<{ [address: string]: string }>({})
  const [aiPlayer, setAiPlayer] = useState<string | null>(null)
  const [aiPersonality, setAiPersonality] = useState<{ name: string; prompt: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [yourPlayerName, setYourPlayerName] = useState<string>("")
  const [messageQueue, setMessageQueue] = useState<Array<() => Promise<void>>>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState(Date.now())
  const [chaosLevel, setChaosLevel] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  // Function to generate a random wallet address
  const generateRandomAddress = () => {
    let result = "0x"
    const characters = "0123456789abcdef"
    for (let i = 0; i < 40; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Generar mensaje de bienvenida con IA
  const generateWelcomeMessage = async () => {
    try {
      const response = await fetch("/api/ai-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [],
          prompt:
            "Generate a short welcome message for a social deduction game where players need to identify which player is an AI. Keep it under 15 words and make it engaging.",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI welcome message")
      }

      const data = await response.json()
      return data.response || "Welcome to the game! Chat with others and spot the AI among us."
    } catch (error) {
      console.error("Error generating welcome message:", error)
      return "Welcome to the game! Chat with others and spot the AI among us."
    }
  }

  // Load game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        let gamePlayers: string[] = []

        // Try to get players from contract if available
        if (contract && gameId) {
          try {
            gamePlayers = await contract.getPlayers(gameId)
            console.log("Players from contract:", gamePlayers)
          } catch (error) {
            console.error("Error getting players from contract:", error)
          }
        }

        // Create a mutable copy of the array
        let mutablePlayers = [...gamePlayers]

        // Make sure current user is included if they have an address
        if (address && !mutablePlayers.includes(address)) {
          mutablePlayers.push(address)
        }

        // Add simulated players until we have exactly 10 players
        const numSimulatedPlayers = Math.max(TOTAL_PLAYERS - mutablePlayers.length, 0)
        for (let i = 0; i < numSimulatedPlayers; i++) {
          const simulatedAddress = generateRandomAddress()
          mutablePlayers.push(simulatedAddress)
        }

        // Ensure we have exactly 10 players
        mutablePlayers = mutablePlayers.slice(0, TOTAL_PLAYERS)

        setPlayers(mutablePlayers)

        // Assign names to players
        const names: { [address: string]: string } = {}
        mutablePlayers.forEach((player: string, index: number) => {
          names[player.toLowerCase()] = generatePlayerName(index)
        })
        setPlayerNames(names)

        // Set your player name
        if (address) {
          const yourName = names[address.toLowerCase()] || "You"
          setYourPlayerName(yourName)
          console.log("Your player name:", yourName)
        }

        // Select a random player as AI (NEVER the current user)
        const otherPlayers = mutablePlayers.filter((player: string) => player.toLowerCase() !== address?.toLowerCase())

        if (otherPlayers.length > 0) {
          // Seleccionar un jugador aleatorio que NO sea el usuario actual
          const randomIndex = Math.floor(Math.random() * otherPlayers.length)
          const selectedAiPlayer = otherPlayers[randomIndex]
          setAiPlayer(selectedAiPlayer)
          console.log("AI player selected:", selectedAiPlayer, "with name:", names[selectedAiPlayer.toLowerCase()])

          // Select a random personality for the AI
          const personality = getRandomPersonality()
          setAiPersonality(personality)
          console.log("AI Personality:", personality.name)
        } else {
          console.error("No other players to select as AI")
        }

        // Generate welcome message with AI
        const welcomeMessage = await generateWelcomeMessage()

        // Welcome message
        setMessages([
          {
            id: 1,
            sender: "Game",
            content: welcomeMessage,
          },
        ])

        setIsInitializing(false)
      } catch (error) {
        console.error("Error loading game data:", error)
        setError("Failed to load game data. Please try again.")
        setIsInitializing(false)
      }
    }

    loadGameData()
  }, [contract, gameId, address])

  // Process message queue
  useEffect(() => {
    const processQueue = async () => {
      if (messageQueue.length > 0 && !isProcessingQueue) {
        setIsProcessingQueue(true)

        // Process solo 1-2 mensajes a la vez para reducir el caos
        const batchSize = Math.min(2, messageQueue.length)
        const batch = messageQueue.slice(0, batchSize)

        // Ejecutar los mensajes secuencialmente en lugar de concurrentemente
        for (const messageFunc of batch) {
          await messageFunc()
          // Añadir un pequeño retraso entre mensajes
          await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700))
        }

        // Remove processed messages from queue
        setMessageQueue((prev) => prev.slice(batchSize))

        setIsProcessingQueue(false)
      }
    }

    processQueue()
  }, [messageQueue, isProcessingQueue])

  // Iniciar la conversación una vez que se hayan cargado los datos
  useEffect(() => {
    if (!isInitializing && players.length > 0 && Object.keys(playerNames).length > 0 && phase === "chat") {
      // Wait a moment after loading to start conversation
      const timer = setTimeout(() => {
        // Añadir mensajes iniciales de una sola vez
        setMessageQueue((prev) => [...prev, generateRandomMessage, generateRandomMessage, generateRandomMessage])
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isInitializing, players.length, Object.keys(playerNames).length, phase])

  // Add a useEffect to keep conversation active
  useEffect(() => {
    // If we're in chat phase
    if (phase === "chat" && messages.length > 1) {
      // Usar un único timer para manejar el caos
      const timer = setTimeout(
        () => {
          // Increase chaos level over time pero más lentamente
          setChaosLevel((prev) => Math.min(prev + 0.05, 10))

          // Calculate time since last message
          const timeSinceLastMessage = Date.now() - lastMessageTime

          // Only add more messages if it's been at least 1000ms since the last one
          if (timeSinceLastMessage > 1000) {
            // Reducir la cantidad de mensajes aleatorios
            const messagesToAdd = Math.floor(Math.random() * 1.5) + 1 // 1-2 mensajes

            for (let i = 0; i < messagesToAdd; i++) {
              // 60% chance to add a message
              if (Math.random() < 0.6) {
                addMessageToQueue()
              }
            }

            // Update last message time
            setLastMessageTime(Date.now())
          }
        },
        Math.random() * 1500 + 1000, // Delay: 1000-2500ms
      )

      return () => clearTimeout(timer)
    }
  }, [phase, messages.length, lastMessageTime])

  // Timer for game phases
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === "chat") {
            console.log("Changing to voting phase")
            setPhase("voting")
            return VOTING_DURATION
          } else {
            clearInterval(timer)
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase])

  // Auto-scroll to last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when isLoading changes to false
  useEffect(() => {
    if (!isLoading && phase === "chat") {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isLoading, phase])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Function to add a message to the queue
  const addMessageToQueue = () => {
    // Evitar añadir más mensajes si ya hay muchos en la cola
    if (messageQueue.length > 10) return

    setMessageQueue((prev) => [...prev, generateRandomMessage])
  }

  // Función para generar mensajes aleatorios usando IA
  const generateRandomMessage = async () => {
    // Don't generate more messages if we're in voting phase or already have many messages
    if (phase === "voting" || messages.length > 50) return

    try {
      // Prepare history for AI - usar más contexto para mantener coherencia temática
      const chatHistory: ChatMessage[] = messages
        .filter((msg) => msg.sender !== "Game") // Exclude system messages
        .slice(-12) // Usar los últimos 12 mensajes para más contexto
        .map((msg) => ({
          role: msg.isYou ? "user" : "assistant",
          content: msg.content,
          sender: msg.sender,
        }))

      // Get the last few message senders to avoid the same person talking too much
      const recentSenders = messages
        .slice(-4) // Aumentado de 3 a 4 para mejor distribución
        .map((msg) => msg.sender)
        .filter((sender) => sender !== "Game")

      // Determine who will respond
      let availableResponders = players.filter((player) => {
        const playerName = playerNames[player.toLowerCase()] || "Unknown"
        // Filter out the current user and recent senders
        return player.toLowerCase() !== address?.toLowerCase() && !recentSenders.includes(playerName)
      })

      // If no available responders, use all non-user players
      if (availableResponders.length === 0) {
        availableResponders = players.filter((player) => player.toLowerCase() !== address?.toLowerCase())
      }

      // Randomly decide if AI should respond - ajustar la probabilidad para que la IA responda de forma más natural
      const aiPlayerAddress = aiPlayer?.toLowerCase() || ""
      const aiPlayerName = playerNames[aiPlayerAddress] || ""
      const isAIAvailable = availableResponders.some((p) => p.toLowerCase() === aiPlayerAddress)

      // Verificar si el último mensaje es del usuario para aumentar la probabilidad de respuesta de la IA
      const lastMessageIsFromUser = messages.length > 0 && messages[messages.length - 1].isYou === true

      // Verificar si hay una pregunta en el último mensaje para aumentar la probabilidad de respuesta
      const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : ""
      const containsQuestion =
        lastMessageContent.includes("?") ||
        lastMessageContent.includes("what") ||
        lastMessageContent.includes("how") ||
        lastMessageContent.includes("why")

      // Ajustar probabilidad basada en contexto
      const aiResponseProbability = containsQuestion ? 0.7 : lastMessageIsFromUser ? 0.5 : 0.25

      const isAIResponse = isAIAvailable && Math.random() < aiResponseProbability

      let responseContent = ""
      let responder = ""

      if (isAIResponse && aiPlayer) {
        // Generate AI response
        responder = playerNames[aiPlayer.toLowerCase()] || "Unknown"
        responseContent = await generateShortResponse(chatHistory, true)
      } else {
        // Choose a random player who is not the current user and not the AI
        const nonAIPlayers = availableResponders.filter((player) => player.toLowerCase() !== aiPlayerAddress)

        if (nonAIPlayers.length > 0) {
          const randomIndex = Math.floor(Math.random() * nonAIPlayers.length)
          const randomPlayer = nonAIPlayers[randomIndex]
          responder = playerNames[randomPlayer.toLowerCase()] || "Unknown"
          responseContent = await generateShortResponse(chatHistory, false)
        }
      }

      if (responder && responseContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: responder,
            content: responseContent,
            isAI: isAIResponse && aiPlayer ? true : false,
          },
        ])
      }
    } catch (error) {
      console.error("Error generating random message:", error)
    }
  }

  // Función para generar respuestas cortas usando IA
  const generateShortResponse = async (chatHistory: ChatMessage[], isAIResponse: boolean) => {
    try {
      const startTime = Date.now()

      // Extraer los últimos 5 mensajes para identificar el tema actual
      const recentMessages = chatHistory.slice(-5)
      const userMessages = recentMessages.filter((msg) => msg.role === "user")
      const lastMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null

      // Determinar el prompt adecuado - modificado para seguir mejor el tema
      const basePrompt = isAIResponse
        ? "You are an AI trying to blend in as a human in a social deduction game. IMPORTANT: Pay close attention to the conversation topic and respond directly to it. Keep responses short (10-20 words) but relevant to the ongoing discussion. Be casual but coherent."
        : "You are a human player in a social deduction game. IMPORTANT: Pay close attention to the conversation topic and respond directly to it. Keep responses short (10-20 words) but relevant to the ongoing discussion. Be casual but coherent."

      // Añadir instrucción específica para seguir el tema si hay mensajes recientes
      let enhancedPrompt = basePrompt

      if (lastMessage) {
        enhancedPrompt += ` Respond directly to this message: "${lastMessage.content}".`
      } else if (userMessages.length > 0) {
        enhancedPrompt += ` The current topic appears to be about "${userMessages[userMessages.length - 1].content}". Stay on this topic.`
      }

      // Añadir instrucción para mantener la coherencia de la conversación
      enhancedPrompt += " Maintain the flow of conversation. If someone asked a question, answer it directly."

      const response = await fetch("/api/ai-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatHistory,
          prompt: enhancedPrompt,
        }),
      })

      const endTime = Date.now()
      setResponseTime(endTime - startTime)

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      // Procesar la respuesta para hacerla más coherente
      let responseContent = data.response || ""

      // Eliminar prefijos como "Player X:" o "You:" del inicio de la respuesta
      responseContent = responseContent.replace(/^(Player \d+|You):\s*/i, "")

      // Si la respuesta es demasiado larga, cortarla de manera más inteligente
      if (responseContent.length > 60) {
        // Aumentado de 50 a 60 para permitir respuestas más completas
        // Intentar cortar en un punto lógico (final de oración o frase)
        const sentenceEnd = responseContent.substring(20, 60).search(/[.!?]\s/) + 20
        if (sentenceEnd > 20) {
          responseContent = responseContent.substring(0, sentenceEnd + 1)
        } else {
          // Si no hay final de oración, cortar en una coma o espacio
          const phraseEnd = responseContent.substring(20, 60).search(/[,;]\s/) + 20
          if (phraseEnd > 20) {
            responseContent = responseContent.substring(0, phraseEnd + 1)
          } else {
            // Si no hay puntuación, cortar en un espacio después de la palabra 10-15
            const words = responseContent.split(" ")
            if (words.length > 12) {
              responseContent = words.slice(0, 12).join(" ") + "..."
            }
          }
        }
      }

      return responseContent
    } catch (error) {
      console.error("Error getting response:", error)
      // Generar una respuesta de fallback usando IA
      try {
        const fallbackResponse = await fetch("/api/ai-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [],
            prompt:
              "Generate a very short (5-7 words) generic response that could fit in any conversation. Make it sound natural.",
          }),
        })

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          return data.response || "Interesting point."
        }
      } catch (fallbackError) {
        console.error("Error getting fallback response:", fallbackError)
      }

      // Si todo falla, usar una respuesta genérica
      return "Interesting point."
    }
  }

  // Función para manejar el envío de mensajes del usuario
  const handleSendMessage = async () => {
    if (!message.trim() || messageCount >= 10 || phase === "voting") return

    // Add user message
    const newMessage = {
      id: messages.length + 1,
      sender: yourPlayerName,
      content: message,
      isYou: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")
    setMessageCount((prev) => prev + 1)
    setLastMessageTime(Date.now())

    // Trigger a more controlled response pattern
    setTimeout(() => {
      // Primero, hacer que la IA responda directamente al usuario con mayor probabilidad
      if (aiPlayer && Math.random() < 0.6) {
        setMessageQueue((prev) => [...prev, generateRandomMessage])

        // Después de la respuesta de la IA, añadir 1-2 respuestas más de otros jugadores
        setTimeout(
          () => {
            const additionalResponses = Math.floor(Math.random() * 2) + 1
            const newQueueItems = []

            for (let i = 0; i < additionalResponses; i++) {
              newQueueItems.push(generateRandomMessage)
            }

            setMessageQueue((prev) => [...prev, ...newQueueItems])
          },
          1500 + Math.random() * 1000,
        )
      } else {
        // Si la IA no responde primero, añadir 1-3 respuestas de otros jugadores
        const responsesToAdd = Math.floor(Math.random() * 2) + 1
        const newQueueItems = []

        for (let i = 0; i < responsesToAdd; i++) {
          newQueueItems.push(generateRandomMessage)
        }

        setMessageQueue((prev) => [...prev, ...newQueueItems])
      }
    }, 500)
  }

  // Handle voting
  const handleVoteComplete = (selectedPlayer: string) => {
    router.push(`/results?gameId=${gameId}&voted=${selectedPlayer}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 text-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      {/* Animated floating elements */}
      <div className="hidden md:block">
        <div className="absolute left-5 top-1/4 animate-float-slow opacity-10">
          <User className="h-12 w-12 text-purple-400" />
        </div>
        <div className="absolute right-10 top-1/3 animate-float-delay opacity-10">
          <User className="h-10 w-10 text-blue-400" />
        </div>
        <div className="absolute left-1/4 bottom-1/4 animate-float opacity-10">
          <Bot className="h-14 w-14 text-purple-500" />
        </div>
        <div className="absolute right-1/4 bottom-1/3 animate-float-slow opacity-10">
          <User className="h-8 w-8 text-purple-400" />
        </div>
      </div>

      <SiteHeader showConfirmation={true} />

      <main className="container mx-auto p-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full shadow-md">
                {phase === "chat" ? (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-white" />
                    <span>Chat Phase</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-white" />
                    <span>Voting Phase</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1 rounded-full shadow-md">
              <Clock className="h-4 w-4 mr-2 text-primary animate-pulse" />
              <span className={`font-mono ${timeLeft < 10 ? "text-red-400" : "text-white"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center shadow-sm">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-4 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500 animate-pulse" />
                  <span>Game Rules</span>
                </div>
                {responseTime && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs text-gray-500">
                          <Info className="h-3 w-3 mr-1" />
                          <span>Response: {responseTime}ms</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last AI response time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li className="group">
                  <span className="group-hover:text-purple-700 transition-colors">
                    One player is an AI agent trying to blend in
                  </span>
                </li>
                <li className="group">
                  <span className="group-hover:text-purple-700 transition-colors">
                    You can send up to 10 messages ({10 - messageCount} remaining)
                  </span>
                </li>
                <li className="group">
                  <span className="group-hover:text-purple-700 transition-colors">Chat phase: 30 seconds</span>
                </li>
                <li className="group">
                  <span className="group-hover:text-purple-700 transition-colors">Voting phase: 30 seconds</span>
                </li>
                <li className="group">
                  <span className="group-hover:text-purple-700 transition-colors">
                    Correctly identify the AI to win a share of the prize pool
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-500 rounded-full opacity-10"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-500 rounded-full opacity-10"></div>

            <CardContent className="p-4 h-[400px] overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <GameMessage key={msg.id} sender={msg.sender} content={msg.content} isYou={msg.isYou} />
                ))}
                {isProcessingQueue && (
                  <div className="flex justify-center py-2">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700 p-4 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex w-full items-center space-x-2">
                <Input
                  ref={inputRef}
                  placeholder={
                    phase === "voting"
                      ? "Voting phase - chat disabled"
                      : messageCount >= 10
                        ? "You've reached your message limit"
                        : "Type your message..."
                  }
                  className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 transition-all duration-300"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={messageCount >= 10 || phase === "voting"}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || messageCount >= 10 || phase === "voting"}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {phase === "chat" && (
                <div className="w-full mt-2 text-xs text-slate-400 flex justify-between">
                  <span>{messageCount}/10 messages used</span>
                  <span>{message.length}/500 characters</span>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>

      {phase === "voting" && (
        <VotingModal
          // Incluir todos los jugadores EXCEPTO el usuario actual para votar
          players={Object.values(playerNames).filter((name) => name !== yourPlayerName && name !== "Game")}
          onVote={handleVoteComplete}
          timeLeft={timeLeft}
          yourPlayerName={yourPlayerName}
        />
      )}

      <style jsx global>{`
       .typing-indicator {
         display: flex;
         align-items: center;
         column-gap: 4px;
       }
       
       .typing-indicator span {
         height: 8px;
         width: 8px;
         background-color: #a855f7;
         border-radius: 50%;
         animation: bounce 1.5s infinite ease-in-out;
       }
       
       .typing-indicator span:nth-child(1) {
         animation-delay: 0s;
       }
       
       .typing-indicator span:nth-child(2) {
         animation-delay: 0.2s;
       }
       
       .typing-indicator span:nth-child(3) {
         animation-delay: 0.4s;
       }
       
       @keyframes bounce {
         0%, 60%, 100% {
           transform: translateY(0);
         }
         30% {
           transform: translateY(-4px);
         }
       }
     `}</style>
      <div className="mt-4">
        <Footer />
      </div>
    </div>
  )
}

