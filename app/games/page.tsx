"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Clock, Plus, Users, AlertTriangle, RefreshCw, Sparkles, Bot, User, Trophy } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ZKSYNC_SEPOLIA_CONFIG } from "@/lib/constants"
import { ethers } from "ethers"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { TransactionNotification } from "@/components/transaction-notification"
import Image from "next/image"

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

interface GameInfo {
  id: number
  entryFee: string
  prizePool: string
  playerCount: number
  status: string
  timeUntilTimeout: number
  isPlayerInGame: boolean
}

interface Notification {
  id: string
  hash: string
  message: string
}

export default function GamesPage() {
  const router = useRouter()
  const { address, connect, disconnect, isConnecting, chainId, switchToZkSync, contract, signer } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isJoiningGame, setIsJoiningGame] = useState<number | null>(null)
  const [isCheckingPlayer, setIsCheckingPlayer] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entryFee, setEntryFee] = useState("0.001")
  const [activeGames, setActiveGames] = useState<GameInfo[]>([])
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "not-started" | "in-progress">("all")
  const [notifications, setNotifications] = useState<Notification[]>([])

  const isWrongNetwork = chainId !== null && chainId !== ZKSYNC_TESTNET_CHAIN_ID

  // Función para añadir una notificación
  const addNotification = (hash: string, message: string) => {
    const newNotification = {
      id: Date.now().toString(),
      hash,
      message,
    }
    setNotifications((prev) => [...prev, newNotification])
  }

  // Función para eliminar una notificación
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Función para formatear el tiempo restante
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Timeout imminent"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Verificar si el usuario ya está en un juego
  const checkIfPlayerInGame = async (gameId: number): Promise<boolean> => {
    if (!contract || !address) return false

    try {
      setIsCheckingPlayer(gameId)
      const players = await contract.getPlayers(gameId)
      return players.some((player: string) => player.toLowerCase() === address.toLowerCase())
    } catch (error) {
      console.error(`Error checking if player is in game ${gameId}:`, error)
      return false
    } finally {
      setIsCheckingPlayer(null)
    }
  }

  const fetchActiveGames = async () => {
    if (!contract) return

    setIsLoading(true)
    try {
      // Get all game IDs by checking the game counter
      const activeGameIds = []
      try {
        const gameIdCounter = await contract.gameIdCounter()
        const gameIdCounterNumber = Number(gameIdCounter)

        // Create an array with all game IDs
        for (let i = 0; i < gameIdCounterNumber; i++) {
          activeGameIds.push(i)
        }
      } catch (error) {
        console.error("Error fetching game counter:", error)
        setError("Failed to fetch games. Please try again.")
        setIsLoading(false)
        return
      }

      // Obtener detalles de cada juego
      const gamesInfo: GameInfo[] = []

      for (const gameId of activeGameIds) {
        try {
          // Initialize with default values
          let entryFee = "0.001"
          let prizePool = "0"
          let playerCount = 0
          let status = "Not Started"
          const timeUntilTimeout = 0
          let isPlayerInGame = false

          // Try to get player information - this is the most reliable data point
          try {
            // Try to determine if the game is in progress or completed using alternative methods
            // First, let's try to get the players to determine if the game exists and has players
            const players = await contract.getPlayers(gameId)
            playerCount = players.length

            // Check if current user is in the game
            if (address) {
              isPlayerInGame = players.some((player: string) => player.toLowerCase() === address.toLowerCase())
            }

            // If we have players, we can assume the game exists
            if (playerCount > 0) {
              // For the status, we'll use a simple heuristic:
              // If there are players but less than 2, it's probably "Not Started"
              // If there are 2 or more players, we'll assume it's "In Progress"
              status = playerCount < 2 ? "Not Started" : "In Progress"

              // For entry fee and prize pool, we'll use default values
              // In a production app, you might want to store these values in a cache or database
              entryFee = "0.001"
              prizePool = (playerCount * 0.001).toFixed(3) // Estimate based on player count
            }
          } catch (playersError) {
            console.error(`Error fetching players for game ${gameId}:`, playersError)
            // Continue with default values
            playerCount = 0
            status = "Not Started"
            entryFee = "0.001"
            prizePool = "0"
            isPlayerInGame = false
          }

          // Only add games that are not completed
          if (status !== "Completed") {
            gamesInfo.push({
              id: Number(gameId),
              entryFee,
              prizePool,
              playerCount,
              status,
              timeUntilTimeout,
              isPlayerInGame,
            })
          }
        } catch (error) {
          console.error(`Error fetching details for game ${gameId}:`, error)
          // Skip this game and continue with others
        }
      }

      // Ordenar juegos: primero los que no han comenzado, luego por tiempo restante
      gamesInfo.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "Not Started" ? -1 : 1
        }
        return b.timeUntilTimeout - a.timeUntilTimeout
      })

      setActiveGames(gamesInfo)
      setError(null)
    } catch (error) {
      console.error("Error fetching active games:", error)
      setError("Failed to load active games. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (contract) {
      fetchActiveGames()

      // Configurar intervalo para actualizar los juegos activos cada 15 segundos
      const interval = setInterval(() => {
        fetchActiveGames()
      }, 15000)

      setRefreshInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [contract, address])

  const createGame = async () => {
    if (!contract || !signer) {
      setError("Wallet not connected or contract not initialized")
      return
    }

    try {
      setIsCreatingGame(true)
      setError(null)
      setSuccess(null)
      setLastTxHash(null)

      // First check if the user is the owner of the contract
      const contractOwner = await contract.owner()
      const currentAddress = await signer.getAddress()

      if (contractOwner.toLowerCase() !== currentAddress.toLowerCase()) {
        setError("Only the contract owner can create games")
        setIsCreatingGame(false)
        return
      }

      // Convert entry fee to wei
      const entryFeeWei = ethers.parseEther(entryFee)

      // Call the createGame function on the contract
      // Note: We're not sending value with this transaction anymore
      const tx = await contract.createGame(entryFeeWei)

      // Set the transaction hash
      setLastTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      // Show success message
      setSuccess(`Game created successfully with entry fee of ${entryFee} ETH`)

      // Add notification
      addNotification(tx.hash, `Game created successfully with entry fee of ${entryFee} ETH`)

      // Refresh active games
      await fetchActiveGames()
    } catch (error: any) {
      console.error("Error creating game:", error)

      // Provide more specific error messages based on the error
      if (error.reason && error.reason.includes("Only owner")) {
        setError("Only the contract owner can create games")
      } else if (error.reason) {
        setError(error.reason)
      } else {
        setError(error.message || "Failed to create game")
      }
    } finally {
      setIsCreatingGame(false)
    }
  }

  // Let's modify the joinGame function to check if the user is the creator of the game

  const joinGame = async (gameId: number) => {
    if (!contract || !signer) {
      setError("Wallet not connected or contract not initialized")
      return
    }

    const game = activeGames.find((g) => g.id === gameId)
    if (!game) {
      setError("Game not found")
      return
    }

    // Si el usuario ya está en el juego, redirigir directamente al lobby
    if (game.isPlayerInGame) {
      router.push(`/lobby?gameId=${gameId}`)
      return
    }

    try {
      setIsJoiningGame(gameId)
      setError(null)
      setSuccess(null)
      setLastTxHash(null)

      // Verificar nuevamente si el usuario ya está en el juego
      const isInGame = await checkIfPlayerInGame(gameId)
      if (isInGame) {
        // Si ya está en el juego, redirigir al lobby
        router.push(`/lobby?gameId=${gameId}`)
        return
      }

      // Check if the user is the contract owner
      const contractOwner = await contract.owner()
      const currentAddress = await signer.getAddress()
      const isOwner = contractOwner.toLowerCase() === currentAddress.toLowerCase()

      // If the user is the owner, redirect to lobby without requiring payment
      if (isOwner) {
        setSuccess(`Accessing game #${gameId} as contract owner`)
        router.push(`/lobby?gameId=${gameId}`)
        return
      }

      // Convert entry fee to wei
      const entryFeeWei = ethers.parseEther(game.entryFee)

      // Call the joinGame function on the contract with the entry fee
      const tx = await contract.joinGame(gameId, {
        value: entryFeeWei,
      })

      // Set the transaction hash
      setLastTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      setSuccess(`Successfully joined game #${gameId}`)

      // Add notification
      addNotification(tx.hash, `Successfully joined game #${gameId} with ${game.entryFee} ETH`)

      // Refresh active games
      await fetchActiveGames()

      // Redirect to lobby or game page
      router.push(`/lobby?gameId=${gameId}`)
    } catch (error: any) {
      console.error("Error joining game:", error)

      // Manejar el error específico de "Already joined this game"
      if (error.reason === "Already joined this game") {
        setError("You have already joined this game")
        // Redirigir al lobby después de un breve retraso
        setTimeout(() => {
          router.push(`/lobby?gameId=${gameId}`)
        }, 2000)
      } else {
        setError(error.message || "Failed to join game")
      }
    } finally {
      setIsJoiningGame(null)
    }
  }

  const filteredGames = activeGames.filter((game) => {
    if (statusFilter === "all") return true
    if (statusFilter === "not-started") return game.status === "Not Started"
    if (statusFilter === "in-progress") return game.status === "In Progress"
    return true
  })

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

      <SiteHeader />

      {/* Notifications */}
      {notifications.map((notification) => (
        <TransactionNotification
          key={notification.id}
          hash={notification.hash}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="max-w-4xl mx-auto mt-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
            AI Turing Arena
          </h1>
          <p className="text-gray-600 mt-2">
            Join an existing game or create a new one to test your AI detection skills
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {!address ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-2">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                Connect Your Wallet
              </CardTitle>
              <CardDescription className="text-gray-600">Connect your wallet to join or create games</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm hover:shadow-md transition-all duration-300 py-1.5"
                onClick={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : isWrongNetwork ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Wrong Network
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please switch to zkSync Sepolia Testnet to continue
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={switchToZkSync}
              >
                Switch to zkSync Sepolia
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-2">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    Wallet Connected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Address:</span>
                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Network:</span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      zkSync Sepolia
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                Available Games
              </h2>
              <div className="flex items-center space-x-2">
                <div className="flex rounded-md overflow-hidden border border-gray-300 shadow-sm">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 text-sm transition-colors ${statusFilter === "all" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("not-started")}
                    className={`px-3 py-1 text-sm transition-colors ${statusFilter === "not-started" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    Not Started
                  </button>
                  <button
                    onClick={() => setStatusFilter("in-progress")}
                    className={`px-3 py-1 text-sm transition-colors ${statusFilter === "in-progress" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    In Progress
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchActiveGames}
                  disabled={isLoading}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 transition-colors"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                  <p className="text-sm text-gray-500">Loading games...</p>
                </div>
              </div>
            ) : filteredGames.length > 0 ? (
              <div className="mb-6">
                <div className="overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Game
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Players
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Prize Pool
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Entry Fee
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredGames.map((game) => (
                          <tr
                            key={game.id}
                            className={`${game.isPlayerInGame ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                <div className="bg-purple-100 p-1 rounded-full mr-1">
                                  <Bot className="h-4 w-4 text-purple-600" />
                                </div>
                                Game #{game.id}
                              </div>
                              {game.status === "Not Started" && game.timeUntilTimeout > 0 && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1 text-purple-500" />
                                  <span>{formatTimeRemaining(game.timeUntilTimeout)}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  game.status === "Not Started"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {game.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Users className="h-4 w-4 mr-1 text-purple-500" />
                                {game.playerCount}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900 flex items-center">
                                <Image
                                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ethereum-eth-logo-RTMH6c0HBN6A8tMd4fKmMDyMw0aZ5T.png"
                                  alt="ETH"
                                  width={14}
                                  height={14}
                                  className="mr-1"
                                />
                                {game.prizePool} ETH
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Image
                                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ethereum-eth-logo-RTMH6c0HBN6A8tMd4fKmMDyMw0aZ5T.png"
                                  alt="ETH"
                                  width={14}
                                  height={14}
                                  className="mr-1"
                                />
                                {game.entryFee} ETH
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              {game.status === "Not Started" ? (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm hover:shadow-md transition-all duration-300"
                                  onClick={() => joinGame(game.id)}
                                  disabled={isJoiningGame === game.id || isCheckingPlayer === game.id}
                                >
                                  {isJoiningGame === game.id || isCheckingPlayer === game.id ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      {isJoiningGame === game.id ? "Joining..." : "Checking..."}
                                    </>
                                  ) : game.isPlayerInGame ? (
                                    "Enter Game"
                                  ) : (
                                    "Join"
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-gray-500 hover:bg-gray-600 cursor-not-allowed"
                                  disabled={true}
                                >
                                  In Progress
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista móvil - solo visible en pantallas pequeñas */}
                <div className="md:hidden mt-4 space-y-4">
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 ${game.isPlayerInGame ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium flex items-center">
                          <div className="bg-purple-100 p-1 rounded-full mr-1">
                            <Bot className="h-4 w-4 text-purple-600" />
                          </div>
                          Game #{game.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            game.status === "Not Started" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {game.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-purple-500" />
                          <span>{game.playerCount} Players</span>
                        </div>

                        <div className="flex items-center">
                          <Image
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ethereum-eth-logo-RTMH6c0HBN6A8tMd4fKmMDyMw0aZ5T.png"
                            alt="ETH"
                            width={14}
                            height={14}
                            className="mr-1"
                          />
                          <span>Prize: {game.prizePool} ETH</span>
                        </div>

                        <div>
                          <span className="text-gray-500">Fee:</span>{" "}
                          <span className="flex items-center inline-flex">
                            <Image
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ethereum-eth-logo-RTMH6c0HBN6A8tMd4fKmMDyMw0aZ5T.png"
                              alt="ETH"
                              width={12}
                              height={12}
                              className="mr-1"
                            />
                            {game.entryFee} ETH
                          </span>
                        </div>

                        {game.status === "Not Started" && game.timeUntilTimeout > 0 && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-purple-500" />
                            <span>{formatTimeRemaining(game.timeUntilTimeout)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        {game.status === "Not Started" ? (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm hover:shadow-md transition-all duration-300"
                            onClick={() => joinGame(game.id)}
                            disabled={isJoiningGame === game.id || isCheckingPlayer === game.id}
                          >
                            {isJoiningGame === game.id || isCheckingPlayer === game.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                {isJoiningGame === game.id ? "Joining..." : "Checking..."}
                              </>
                            ) : game.isPlayerInGame ? (
                              "Enter Game"
                            ) : (
                              `Join Game (${game.entryFee} ETH)`
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-gray-500 hover:bg-gray-600 cursor-not-allowed"
                            disabled={true}
                          >
                            Game In Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-6 shadow-md">
                <div className="flex justify-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Bot className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <p className="text-gray-500 mb-4">No games found matching your filter</p>
                <p className="text-sm text-gray-400">Try changing the filter or create a new game</p>
              </div>
            )}

            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 text-purple-500 mr-2" />
                  Create New Game
                </CardTitle>
                <CardDescription className="text-gray-600">Start a new game and invite others to join</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Fee (ETH)
                    </label>
                    <Input
                      id="entryFee"
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="bg-white border-gray-300 focus:ring-purple-500 transition-all duration-300"
                      step="0.001"
                      min="0.001"
                    />
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-1 text-purple-500" />
                      Games automatically start after 5 minutes if no new players join
                    </p>
                    <p className="flex items-center mb-1">
                      <User className="h-4 w-4 mr-1 text-purple-500" />
                      You'll automatically join the game you create
                    </p>
                    <p className="flex items-center">
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ethereum-eth-logo-RTMH6c0HBN6A8tMd4fKmMDyMw0aZ5T.png"
                        alt="ETH"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      Entry fee will be added to the prize pool
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                  onClick={createGame}
                  disabled={isCreatingGame}
                >
                  {isCreatingGame ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Game...
                    </>
                  ) : (
                    <>
                      Create New Game
                      <Trophy className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  )
}

