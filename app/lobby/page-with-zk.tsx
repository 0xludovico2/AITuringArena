"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Users, AlertTriangle } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ZKSYNC_SEPOLIA_CONFIG, TURING_ARENA_CONTRACT_ADDRESS } from "@/lib/constants"
import { ethers } from "ethers"
import { SiteHeader } from "@/components/site-header"
import { TransactionHash } from "@/components/transaction-hash"
import { ZKVerification } from "@/components/zk-verification"
import { useZKIdentity } from "@/lib/hooks/use-zk-identity"
import { Footer } from "@/components/footer"

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

export default function LobbyPageWithZK() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, connect, disconnect, isConnecting, chainId, switchToZkSync, contract, signer } = useWeb3()
  const { isVerified: isZKVerified, storeIdentity } = useZKIdentity()

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

  const isWrongNetwork = chainId !== null && chainId !== ZKSYNC_TESTNET_CHAIN_ID

  // Always clear ZK verification on page load for demo purposes
  useEffect(() => {
    localStorage.removeItem("zk-commitment")
    localStorage.removeItem("zk-secret")
  }, [])

  useEffect(() => {
    // Get current game ID and details if contract is available
    const fetchGameDetails = async () => {
      if (contract) {
        try {
          const gameIdCounter = await contract.gameIdCounter()
          const gameIdCounterNumber = Number(gameIdCounter)
          const currentId = gameIdCounterNumber > 0 ? gameIdCounterNumber - 1 : 0
          setCurrentGameId(currentId)

          if (gameIdCounterNumber > 0) {
            try {
              const details = await contract.getGameDetails(currentId)
              const entryFeeInETH = ethers.formatEther(details.entryFee)
              const prizePoolInETH = ethers.formatEther(details.prizePool)

              setEntryFee(entryFeeInETH)
              setPrizePool(prizePoolInETH)

              const statusMap = ["Not Started", "In Progress", "Completed"]
              const statusString = statusMap[Number(details.status)] || "Unknown"
              setGameStatus(statusString)

              if (address) {
                try {
                  const players = await contract.getPlayers(currentId)
                  const hasJoined = players.some((player: string) => player.toLowerCase() === address.toLowerCase())
                  if (hasJoined) {
                    setHasPurchased(true)
                  }
                } catch (playersError) {
                  console.error("Error fetching players:", playersError)
                }
              }
            } catch (detailsError) {
              console.error("Error fetching specific game details:", detailsError)
              setGameStatus("Unknown")
              setPrizePool("0")
              setEntryFee("0.001")
            }
          } else {
            setGameStatus("No Active Game")
            setPrizePool("0")
            setEntryFee("0.001")
          }
        } catch (error) {
          console.error("Error fetching game counter:", error)
          setGameStatus("Unknown")
          setPrizePool("0")
          setEntryFee("0.001")
        }
      }
    }

    fetchGameDetails()
  }, [contract, address])

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

      // Update prize pool
      try {
        const details = await contract.getGameDetails(currentGameId)
        setPrizePool(ethers.formatEther(details.prizePool))
      } catch (error) {
        console.error("Error updating prize pool:", error)
      }
    } catch (error: any) {
      console.error("Error purchasing ticket:", error)
      setError(error.message || "Failed to purchase ticket")
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
            router.push(`/game?gameId=${gameId || currentGameId}&useZK=true`)
            return prev
          }
        })
      }, 2000)
    }, 1500)
  }

  const handleZKVerified = (commitment: string, secret: string) => {
    // Store the ZK identity for later use in voting
    storeIdentity(commitment, secret)
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

        {lastTxHash && (
          <div className="mb-4">
            <TransactionHash hash={lastTxHash} />
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

        {!address ? (
          <Card className="bg-gray-100 border-gray-200 text-black">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription className="text-gray-600">Connect your wallet to join the game</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={connect} disabled={isConnecting}>
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
          <Card className="bg-gray-100 border-gray-200 text-black">
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
              <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-200 rounded-md">
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
              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={switchToZkSync}>
                Switch to zkSync Sepolia
              </Button>
            </CardFooter>
          </Card>
        ) : !isZKVerified ? (
          <ZKVerification onVerified={handleZKVerified} />
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
                <p className="mt-2 text-purple-700">Your identity is verified with Zero-Knowledge Proofs</p>
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
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  )
}

