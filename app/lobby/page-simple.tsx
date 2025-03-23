"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Users } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ZKSYNC_SEPOLIA_CONFIG, TURING_ARENA_CONTRACT_ADDRESS } from "@/lib/constants"
import { SiteHeader } from "@/components/site-header"
// Importar el componente de verificación simplificado de World ID
import { WorldIDVerificationSimple } from "@/components/world-id-verification-simple"

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

export default function LobbyPageSimple() {
  const router = useRouter()
  const { address, connect, disconnect, isConnecting, chainId, switchToZkSync, contract, signer } = useWeb3()
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
  // Añadir un nuevo estado para controlar si el usuario está verificado con World ID
  const [isWorldIdVerified, setIsWorldIdVerified] = useState(false)

  const isWrongNetwork = chainId !== null && chainId !== ZKSYNC_TESTNET_CHAIN_ID

  // Simulación de carga de datos del juego
  useEffect(() => {
    // Simulación simple para la vista previa
    setCurrentGameId(1)
    setGameStatus("Not Started")
    setPrizePool("0.005")
    setEntryFee("0.001")
  }, [])

  const purchaseTicket = async () => {
    setIsLoading(true)
    setError(null)

    // Simulación de compra de ticket
    setTimeout(() => {
      setHasPurchased(true)
      setIsLoading(false)
    }, 1500)
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
            router.push("/game")
            return prev
          }
        })
      }, 2000)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <SiteHeader />

      <div className="max-w-md mx-auto mt-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {currentGameId !== null && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-sm text-gray-600">Current Game</p>
            <p className="font-bold">Game #{currentGameId}</p>
            <p className="text-sm mt-1">
              Status: <span className="font-medium">{gameStatus}</span>
            </p>
            <p className="text-sm">
              Entry Fee: <span className="font-medium">{entryFee} ETH</span>
            </p>
            <p className="text-sm">
              Prize Pool: <span className="font-medium">{prizePool} ETH</span>
            </p>
          </div>
        )}

        {!isWorldIdVerified ? (
          <WorldIDVerificationSimple onVerified={() => setIsWorldIdVerified(true)} />
        ) : !hasPurchased ? (
          <Card className="bg-gray-100 border-gray-200 text-black">
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
                <p className="mt-2 font-semibold">Contract Address: {TURING_ARENA_CONTRACT_ADDRESS}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
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
        ) : !waitingForPlayers ? (
          <Card className="bg-gray-100 border-gray-200 text-black">
            <CardHeader>
              <CardTitle>Create Your AI Agent</CardTitle>
              <CardDescription className="text-gray-600">
                Write a prompt to define your AI agent (max 230 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: A friendly AI that speaks with a Southern accent and loves to talk about fishing..."
                className="bg-white border-gray-300 text-black"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              <div className="text-right mt-2 text-sm text-gray-600">{prompt.length}/230 characters</div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={submitPrompt}
                disabled={isLoading || prompt.length === 0 || prompt.length > 230}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit & Join Game"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="bg-gray-100 border-gray-200 text-black">
            <CardHeader>
              <CardTitle>Waiting for Players</CardTitle>
              <CardDescription className="text-gray-600">
                The game will start once all players have joined
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-6 w-6 mr-2 text-purple-500" />
                <span className="text-xl font-bold">{playerCount}/10 Players</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${(playerCount / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

