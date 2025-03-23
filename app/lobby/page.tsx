"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Users, AlertTriangle, Sparkles, Bot, User } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ZKSYNC_SEPOLIA_CONFIG } from "@/lib/constants"
import { ethers } from "ethers"
import { SiteHeader } from "@/components/site-header"
import { TransactionHash } from "@/components/transaction-hash"
import { WorldIDVerificationSimple } from "@/components/world-id-verification-simple"
import { Footer } from "@/components/footer"

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, connect, disconnect, isConnecting, chainId, switchToZkSync, contract, signer } = useWeb3()

  const gameId = searchParams.get("gameId")
  const [hasPurchased, setHasPurchased] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [waitingForPlayers, setWaitingForPlayers] = useState(false)
  const [playerCount, setPlayerCount] = useState(3)
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const [prizePool, setPrizePool] = useState<string>("0")
  const [error, setError] = useState<string | null>(null)
  const [gameStatus, setGameStatus] = useState<string>("Unknown")
  const [entryFee, setEntryFee] = useState<string>("0.001")
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [isWorldIdVerified, setIsWorldIdVerified] = useState(false)

  const isWrongNetwork = chainId !== null && chainId !== ZKSYNC_TESTNET_CHAIN_ID

  // Siempre limpiar la verificación de World ID al cargar la página
  useEffect(() => {
    // Eliminar la verificación guardada para que siempre se muestre
    localStorage.removeItem("worldIdVerified")
    setIsWorldIdVerified(false)
  }, [])

  // Reemplazar la función fetchGameDetails con esta versión mejorada que evita llamar directamente a getGameDetails()
  const fetchGameDetails = async () => {
    if (contract && address) {
      try {
        // Obtener el ID del juego, ya sea del parámetro de URL o del contador de juegos
        let gameToCheck = gameId ? Number.parseInt(gameId) : null

        if (gameToCheck === null) {
          // Si no hay gameId en la URL, obtener el juego más reciente
          try {
            const gameIdCounter = await contract.gameIdCounter()
            const gameIdCounterNumber = Number(gameIdCounter)
            gameToCheck = gameIdCounterNumber > 0 ? gameIdCounterNumber - 1 : 0
          } catch (error) {
            console.error("Error fetching game counter:", error)
            gameToCheck = 0 // Valor predeterminado si no podemos obtener el contador
          }
        }

        setCurrentGameId(gameToCheck)

        // Verificar si el usuario ya está en el juego (esto debe hacerse primero)
        try {
          const players = await contract.getPlayers(gameToCheck)
          const hasJoined = players.some((player: string) => player.toLowerCase() === address.toLowerCase())
          const playerCount = players.length

          if (hasJoined) {
            console.log("User already joined game #", gameToCheck)
            setHasPurchased(true)
          } else {
            console.log("User has not joined game #", gameToCheck)
            setHasPurchased(false)
          }

          // Determinar el estado del juego basado en el número de jugadores
          // Esta es una heurística simple: si hay 2 o más jugadores, asumimos que está en progreso
          const status = playerCount < 2 ? "Not Started" : "In Progress"
          setGameStatus(status)

          // Estimar el prize pool basado en el número de jugadores
          const estimatedPrizePool = (playerCount * 0.001).toFixed(3)
          setPrizePool(estimatedPrizePool)

          // Usar un valor predeterminado para entry fee
          setEntryFee("0.001")
        } catch (playersError) {
          console.error("Error fetching players:", playersError)
          // Usar valores predeterminados si no podemos obtener los jugadores
          setHasPurchased(false)
          setGameStatus("Not Started")
          setPrizePool("0")
          setEntryFee("0.001")
        }
      } catch (error) {
        console.error("Error in fetchGameDetails:", error)
        setGameStatus("Unknown")
        setPrizePool("0")
        setEntryFee("0.001")
      }
    }
  }

  useEffect(() => {
    // Get current game ID and details if contract is available
    if (contract && address) {
      fetchGameDetails()
    }
  }, [contract, address, gameId])

  // Modify the purchaseTicket function to check if the user has already joined the game
  const purchaseTicket = async () => {
    if (!contract || !signer || currentGameId === null) {
      setError("Contract not initialized or game ID not available")
      return
    }

    if (gameStatus === "Completed") {
      setError("This game has already finished. Please wait for a new game.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setLastTxHash(null)

      // First check if the user is already in the game
      try {
        const players = await contract.getPlayers(currentGameId)
        const isAlreadyJoined = players.some((player: string) => player.toLowerCase() === address?.toLowerCase())

        if (isAlreadyJoined) {
          console.log("User already joined this game, skipping transaction")
          setHasPurchased(true)
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error("Error checking if player is already in game:", error)
        // Continue with purchase attempt if we can't check
      }

      // Check if the user is the contract owner
      const contractOwner = await contract.owner()
      const currentAddress = await signer.getAddress()
      const isOwner = contractOwner.toLowerCase() === currentAddress.toLowerCase()

      // If the user is the owner, set hasPurchased to true without requiring payment
      if (isOwner) {
        console.log("User is contract owner, skipping payment")
        setHasPurchased(true)
        setIsLoading(false)
        return
      }

      // Convert entry fee to wei
      const entryFeeWei = ethers.parseEther(entryFee)

      // Call the joinGame function on the contract with the entry fee
      const tx = await contract.joinGame(currentGameId, {
        value: entryFeeWei,
      })

      // Set the transaction hash
      setLastTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      setHasPurchased(true)

      // Update prize pool and player count
      try {
        const players = await contract.getPlayers(currentGameId)
        const playerCount = players.length
        const estimatedPrizePool = (playerCount * 0.001).toFixed(3)
        setPrizePool(estimatedPrizePool)
      } catch (error) {
        console.error("Error updating prize pool:", error)
      }
    } catch (error: any) {
      console.error("Error purchasing ticket:", error)

      // If the error is "Already joined this game", set hasPurchased to true
      if (error.reason === "Already joined this game") {
        setHasPurchased(true)
      } else {
        setError(error.message || "Failed to purchase ticket")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const submitPrompt = () => {
    if (prompt.length > 230) return
    setIsLoading(true)
    setError(null)

    setTimeout(() => {
      setWaitingForPlayers(true)
      setIsLoading(false)

      // Simulate players joining
      const interval = setInterval(() => {
        setPlayerCount((prev) => {
          if (prev < 10) {
            return prev + 1
          } else {
            clearInterval(interval)
            router.push(`/game?gameId=${gameId || currentGameId}`)
            return prev
          }
        })
      }, 2000)
    }, 1500)
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

      <SiteHeader />

      <div className="max-w-md mx-auto mt-8 relative z-10">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {lastTxHash && (
          <div className="mb-4">
            <TransactionHash hash={lastTxHash} />
          </div>
        )}

        {currentGameId !== null && (
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-center shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="bg-purple-100 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Current Game</p>
            <p className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              Game #{currentGameId}
            </p>
            <p className="text-sm mt-1">
              Status:{" "}
              <span
                className={`font-medium ${gameStatus === "In Progress" ? "text-green-600" : gameStatus === "Completed" ? "text-blue-600" : "text-purple-600"}`}
              >
                {gameStatus}
              </span>
            </p>
            <p className="text-sm">
              Entry Fee: <span className="font-medium">{entryFee} ETH</span>
            </p>
            <p className="text-sm">
              Prize Pool: <span className="font-medium">{prizePool} ETH</span>
            </p>
          </div>
        )}

        {!address ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-2">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                Connect Your Wallet
              </CardTitle>
              <CardDescription className="text-gray-600">Connect your wallet to join the game</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : isWrongNetwork ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Wrong Network
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please switch to zkSync Sepolia Testnet to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-100 rounded-md">
                <p className="mb-2">
                  If automatic switching fails, you can add zkSync Sepolia Testnet manually with these parameters:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Network Name: {ZKSYNC_SEPOLIA_CONFIG.chainName}</li>
                  <li>RPC URL: {ZKSYNC_SEPOLIA_CONFIG.rpcUrls[0]}</li>
                  <li>Chain ID: {ZKSYNC_SEPOLIA_CONFIG.chainId}</li>
                  <li>Currency Symbol: {ZKSYNC_SEPOLIA_CONFIG.nativeCurrency.symbol}</li>
                  <li>Block Explorer: {ZKSYNC_SEPOLIA_CONFIG.blockExplorerUrls[0]}</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={switchToZkSync}
              >
                Switch to zkSync Sepolia
              </Button>
            </CardFooter>
          </Card>
        ) : !isWorldIdVerified ? (
          <WorldIDVerificationSimple onVerified={() => setIsWorldIdVerified(true)} />
        ) : hasPurchased ? (
          // Si ya ha comprado un ticket, mostrar directamente la creación del prompt
          !waitingForPlayers ? (
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  Create Your AI Agent
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Write a prompt to define your AI agent (max 230 characters)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: A friendly AI that speaks with a Southern accent and loves to talk about fishing..."
                  className="bg-white border-gray-300 text-black focus:ring-purple-500 transition-all duration-300"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <div className="text-right mt-2 text-sm text-gray-600">
                  <span className={prompt.length > 200 ? "text-amber-600" : ""}>{prompt.length}</span>/230 characters
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                  onClick={submitPrompt}
                  disabled={isLoading || prompt.length === 0 || prompt.length > 230}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit & Join Game
                      <Bot className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  Waiting for Players
                </CardTitle>
                <CardDescription className="text-gray-600">
                  The game will start once all players have joined
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 mr-2 text-purple-500" />
                  <span className="text-xl font-bold">{playerCount}/10 Players</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-700 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(playerCount / 10) * 100}%` }}
                  ></div>
                </div>

                {/* Animated players joining */}
                <div className="mt-6 relative h-20">
                  {Array.from({ length: playerCount }).map((_, index) => (
                    <div
                      key={index}
                      className="absolute transition-all duration-500 ease-out"
                      style={{
                        left: `${(index / 10) * 100}%`,
                        top: `${Math.sin(index) * 10 + 30}%`,
                        animation: `float ${3 + (index % 3)}s ease-in-out infinite`,
                        animationDelay: `${index * 0.5}s`,
                      }}
                    >
                      <div className={`bg-${index % 2 ? "purple" : "blue"}-100 p-1 rounded-full`}>
                        <User className={`h-4 w-4 text-${index % 2 ? "purple" : "blue"}-500`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </CardFooter>
            </Card>
          )
        ) : (
          // Si no ha comprado un ticket, mostrar la opción de compra
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <CardHeader>
              <CardTitle>Purchase Ticket</CardTitle>
              <CardDescription className="text-gray-600">Buy a ticket to enter the game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span>Entry Fee:</span>
                <span className="font-bold">{entryFee} ETH</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span>Current Prize Pool:</span>
                <span className="font-bold">{prizePool} ETH</span>
              </div>
              <div className="text-sm text-gray-600 mt-4 p-3 bg-gray-200 rounded-md">
                <p>
                  This transaction will call the TuringArena smart contract on zkSync Sepolia Testnet to join the
                  current game.
                </p>
                <p className="mt-2 font-semibold">Contract Address: {ZKSYNC_SEPOLIA_CONFIG.rpcUrls[0]}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={purchaseTicket}
                disabled={isLoading || gameStatus === "Completed"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : gameStatus === "Completed" ? (
                  "Game Already Finished"
                ) : (
                  `Purchase Ticket (${entryFee} ETH)`
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Footer />
      </div>

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
    </div>
  )
}

