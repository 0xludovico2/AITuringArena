"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, AlertTriangle } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { ZKSYNC_SEPOLIA_CONFIG } from "@/lib/constants"
import { ethers } from "ethers"
import { SiteHeader } from "@/components/site-header"
import { TransactionHash } from "@/components/transaction-hash"
import { Footer } from "@/components/footer"

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

export default function AdminPage() {
  const { address, connect, disconnect, isConnecting, chainId, switchToZkSync, contract, signer } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entryFee, setEntryFee] = useState("0.001")
  const [gameIdToFinish, setGameIdToFinish] = useState("")
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const [gameDetails, setGameDetails] = useState<{
    entryFee: string
    prizePool: string
    playerCount: number
    status: string
  } | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [gameDuration, setGameDuration] = useState("300") // 5 minutes default
  const [forceFinish, setForceFinish] = useState(false)
  const [gameStatusList, setGameStatusList] = useState<Array<{ id: number; status: string; playerCount: number }>>([])
  const [isLoadingGameList, setIsLoadingGameList] = useState(false)
  const [bypassChecks, setBypassChecks] = useState(false)

  const isWrongNetwork = chainId !== null && chainId !== ZKSYNC_TESTNET_CHAIN_ID

  const fetchGameDetails = async () => {
    if (contract) {
      try {
        const gameIdCounter = await contract.gameIdCounter()

        // Convertir BigInt a Number para comparaciones
        const gameIdCounterNumber = Number(gameIdCounter)

        // Game IDs are 0-indexed, so the current game is gameIdCounter - 1
        const currentId = gameIdCounterNumber > 0 ? gameIdCounterNumber - 1 : 0
        setCurrentGameId(currentId)

        // Only try to get game details if there's at least one game
        if (gameIdCounterNumber > 0) {
          try {
            const details = await contract.getGameDetails(currentId)

            // Convert values
            const entryFeeInETH = ethers.formatEther(details.entryFee)
            const prizePoolInETH = ethers.formatEther(details.prizePool)

            // Map status number to string
            const statusMap = ["Not Started", "In Progress", "Completed"]
            const statusString = statusMap[Number(details.status)] || "Unknown"

            setGameDetails({
              entryFee: entryFeeInETH,
              prizePool: prizePoolInETH,
              playerCount: Number(details.playerCount),
              status: statusString,
            })
          } catch (detailsError) {
            console.error("Error fetching specific game details:", detailsError)
            // Set default values if we can't get details
            setGameDetails({
              entryFee: "0.001",
              prizePool: "0",
              playerCount: 0,
              status: "Unknown",
            })
          }
        } else {
          // No games exist yet
          setGameDetails({
            entryFee: "0.001",
            prizePool: "0",
            playerCount: 0,
            status: "No Active Game",
          })
        }
      } catch (error) {
        console.error("Error fetching game counter:", error)
        setError("Failed to connect to the contract. Please try again later.")
      }
    }
  }

  const fetchAllGames = async () => {
    if (!contract) return

    setIsLoadingGameList(true)
    try {
      const gameIdCounter = await contract.gameIdCounter()
      const gameIdCounterNumber = Number(gameIdCounter)

      const statusList = []
      const statusMap = ["Not Started", "In Progress", "Completed"]

      for (let i = 0; i < gameIdCounterNumber; i++) {
        try {
          const details = await contract.getGameDetails(i)
          const statusString = statusMap[Number(details.status)] || "Unknown"
          statusList.push({
            id: i,
            status: statusString,
            playerCount: Number(details.playerCount),
          })
        } catch (error) {
          console.error(`Error fetching details for game ${i}:`, error)
          statusList.push({ id: i, status: "Error", playerCount: 0 })
        }
      }

      setGameStatusList(statusList)
    } catch (error) {
      console.error("Error fetching all games:", error)
    } finally {
      setIsLoadingGameList(false)
    }
  }

  useEffect(() => {
    // Get current game ID and details if contract is available
    const fetchGameDetailsWrapper = async () => {
      await fetchGameDetails()
    }

    fetchGameDetailsWrapper()
  }, [contract])

  const createGame = async () => {
    if (!contract) {
      setError("Contract not initialized")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      setLastTxHash(null)

      // Convert ETH amount to wei
      const entryFeeWei = ethers.parseEther(entryFee)

      // Call the createGame function on the contract
      const tx = await contract.createGame(entryFeeWei)

      // Set the transaction hash
      setLastTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      setSuccess(`Game created successfully with entry fee of ${entryFee} ETH`)

      // Refresh game details
      const gameIdCounter = await contract.gameIdCounter()
      setCurrentGameId(Number(gameIdCounter) - 1)

      // Refresh game details
      await fetchGameDetails()
    } catch (error: any) {
      console.error("Error creating game:", error)
      setError(error.message || "Failed to create game")
    } finally {
      setIsLoading(false)
    }
  }

  const setAIPlayer = async (gameId: string) => {
    if (!contract) {
      setError("Contract not initialized")
      return false
    }

    try {
      // Set a dummy AI player
      const dummyAIPlayer = "0x0000000000000000000000000000000000000001"
      const tx = await contract.setAIPlayer(gameId, dummyAIPlayer)
      await tx.wait()
      return true
    } catch (error: any) {
      console.error("Error setting AI player:", error)
      return false
    }
  }

  const startGameById = async (gameId: string, duration = 60) => {
    if (!contract) {
      setError("Contract not initialized")
      return false
    }

    try {
      const tx = await contract.startGame(gameId, duration)
      await tx.wait()
      return true
    } catch (error: any) {
      console.error("Error starting game:", error)
      return false
    }
  }

  const startGame = async () => {
    if (!contract || currentGameId === null) {
      setError("Contract not initialized or no game available")
      return
    }

    if (!gameDetails) {
      setError("Game details not available")
      return
    }

    if (gameDetails.status !== "Not Started") {
      setError(`Cannot start game in '${gameDetails.status}' status. Game must be in 'Not Started' status.`)
      return
    }

    if (gameDetails.playerCount < 2) {
      setError("Not enough players to start the game. Need at least 2 players.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      setLastTxHash(null)

      // Set AI player
      const aiSuccess = await setAIPlayer(currentGameId.toString())
      if (!aiSuccess) {
        setError("Failed to set AI player. Game may already have an AI player set.")
        setIsLoading(false)
        return
      }

      // Call the startGame function on the contract
      const duration = Number.parseInt(gameDuration)
      const tx = await contract.startGame(currentGameId, duration)

      // Set the transaction hash
      setLastTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      setSuccess(`Game #${currentGameId} started successfully with duration of ${duration} seconds`)

      // Refresh game details
      await fetchGameDetails()
    } catch (error: any) {
      console.error("Error starting game:", error)
      setError(error.message || "Failed to start game")
    } finally {
      setIsLoading(false)
    }
  }

  const directFinishGame = async (gameId: string) => {
    if (!contract) {
      return { success: false, hash: null, error: "Contract not initialized" }
    }

    try {
      // Call the endGame function on the contract directly without any checks
      const tx = await contract.endGame(gameId)
      const hash = tx.hash

      // Wait for transaction to be mined
      await tx.wait()

      return { success: true, hash, error: null }
    } catch (error: any) {
      console.error("Error in direct finish game:", error)
      return {
        success: false,
        hash: null,
        error: error.message || "Failed to finish game directly",
      }
    }
  }

  const finishGame = async () => {
    if (!contract) {
      setError("Contract not initialized")
      return
    }

    const gameId = gameIdToFinish || (currentGameId !== null ? currentGameId.toString() : "")

    if (!gameId) {
      setError("Please enter a game ID")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      setLastTxHash(null)

      // If bypass checks is enabled, try to finish the game directly
      if (bypassChecks) {
        const result = await directFinishGame(gameId)
        if (result.success) {
          setLastTxHash(result.hash)
          setSuccess(`Game #${gameId} finished successfully with emergency bypass`)
        } else {
          setError(result.error || "Failed to finish game with emergency bypass")
        }
        setIsLoading(false)
        setBypassChecks(false)
        return
      }

      // Check if the game is in progress
      const details = await contract.getGameDetails(gameId)
      const statusMap = ["Not Started", "In Progress", "Completed"]
      const statusString = statusMap[Number(details.status)] || "Unknown"
      const playerCount = Number(details.playerCount)

      // If game is already completed, show error
      if (statusString === "Completed") {
        setError(`Game #${gameId} is already completed.`)
        setIsLoading(false)
        return
      }

      // If game is not in progress and force finish is not enabled, show error
      if (statusString !== "In Progress" && !forceFinish) {
        setError(
          `Cannot finish game in '${statusString}' status. Game must be in 'In Progress' status. Use "Force Finish" for emergency situations.`,
        )
        setIsLoading(false)
        return
      }

      // If force finish is enabled and game is not in progress, try to start it
      if (forceFinish && statusString === "Not Started") {
        // If there are not enough players, we can't start the game
        if (playerCount < 2) {
          setError(
            `Game #${gameId} has only ${playerCount} player(s). Need at least 2 players to start. Cannot force finish.`,
          )
          setIsLoading(false)
          return
        }

        // Try to set AI player and start the game
        const aiSuccess = await setAIPlayer(gameId)
        if (!aiSuccess) {
          setError(`Failed to set AI player for game #${gameId}. Cannot force finish.`)
          setIsLoading(false)
          return
        }

        const startSuccess = await startGameById(gameId)
        if (!startSuccess) {
          setError(`Failed to start game #${gameId}. Cannot force finish.`)
          setIsLoading(false)
          return
        }

        setSuccess(`Successfully started game #${gameId}. Now attempting to finish it.`)
      }

      // Now try to finish the game
      const result = await directFinishGame(gameId)
      if (result.success) {
        setLastTxHash(result.hash)
        setSuccess(`Game #${gameId} finished successfully`)
      } else {
        setError(result.error || "Failed to finish game")
      }

      // Reset force finish after successful completion
      setForceFinish(false)

      // Refresh game details
      await fetchGameDetails()
      await fetchAllGames()
    } catch (error: any) {
      console.error("Error finishing game:", error)
      setError(error.message || "Failed to finish game")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <SiteHeader />

      <div className="max-w-md mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>{success}</p>
          </div>
        )}

        {lastTxHash && (
          <div className="mb-4">
            <TransactionHash hash={lastTxHash} />
          </div>
        )}

        {!address ? (
          <Card className="bg-gray-100 border-gray-200 text-black mb-6">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription className="text-gray-600">Connect your admin wallet to manage games</CardDescription>
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
          <Card className="bg-gray-100 border-gray-200 text-black mb-6">
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
              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={switchToZkSync}>
                Switch to zkSync Sepolia
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Card className="bg-gray-100 border-gray-200 text-black mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span>Wallet Connected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="text-red-600 border-red-200 hover:bg-red-50"
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
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">zkSync Sepolia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentGameId !== null && gameDetails && (
              <Card className="bg-gray-100 border-gray-200 text-black mb-6">
                <CardHeader>
                  <CardTitle>Current Game Status</CardTitle>
                  <CardDescription className="text-gray-600">Game #{currentGameId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={`font-medium ${
                          gameDetails.status === "In Progress"
                            ? "text-green-600"
                            : gameDetails.status === "Completed"
                              ? "text-blue-600"
                              : ""
                        }`}
                      >
                        {gameDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry Fee:</span>
                      <span className="font-medium">{gameDetails.entryFee} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prize Pool:</span>
                      <span className="font-medium">{gameDetails.prizePool} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Players:</span>
                      <span className="font-medium">{gameDetails.playerCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-100 border-gray-200 text-black mb-6">
              <CardHeader>
                <CardTitle>Create New Game</CardTitle>
                <CardDescription className="text-gray-600">Set up a new game for players to join</CardDescription>
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
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={createGame} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Game...
                    </>
                  ) : (
                    "Create Game"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-100 border-gray-200 text-black mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>All Games</CardTitle>
                  <CardDescription className="text-gray-600">View and manage all games</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAllGames} disabled={isLoadingGameList}>
                  {isLoadingGameList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="max-h-[200px] overflow-y-auto">
                  {isLoadingGameList ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    </div>
                  ) : gameStatusList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {gameStatusList.map((game) => (
                        <div key={game.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">Game #{game.id}</span>
                            <div className="text-xs text-gray-500">Players: {game.playerCount}</div>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`text-sm mr-2 ${
                                game.status === "In Progress"
                                  ? "text-green-600"
                                  : game.status === "Completed"
                                    ? "text-blue-600"
                                    : ""
                              }`}
                            >
                              {game.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">No games found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border-gray-200 text-black mb-6">
              <CardHeader>
                <CardTitle>Start Game</CardTitle>
                <CardDescription className="text-gray-600">Start a game that has players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gameDuration" className="block text-sm font-medium text-gray-700 mb-1">
                      Game Duration (seconds)
                    </label>
                    <Input
                      id="gameDuration"
                      type="number"
                      value={gameDuration}
                      onChange={(e) => setGameDuration(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={startGame}
                  disabled={
                    isLoading || !gameDetails || gameDetails.status !== "Not Started" || gameDetails.playerCount < 2
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Game...
                    </>
                  ) : (
                    "Start Game"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-100 border-gray-200 text-black mb-6">
              <CardHeader>
                <CardTitle>Finish Game</CardTitle>
                <CardDescription className="text-gray-600">End a game and distribute prizes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-1">
                      Game ID {currentGameId !== null && `(Current: ${currentGameId})`}
                    </label>
                    <Input
                      id="gameId"
                      type="number"
                      value={gameIdToFinish}
                      onChange={(e) => setGameIdToFinish(e.target.value)}
                      placeholder={currentGameId !== null ? currentGameId.toString() : ""}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="forceFinish"
                      checked={forceFinish}
                      onChange={(e) => setForceFinish(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="forceFinish" className="text-sm text-gray-700">
                      Force finish (try to start game first if needed)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="bypassChecks"
                      checked={bypassChecks}
                      onChange={(e) => setBypassChecks(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="bypassChecks" className="text-sm text-gray-700">
                      Bypass all checks (emergency only)
                    </label>
                  </div>
                  {(forceFinish || bypassChecks) && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-xs">
                      Warning: Using these options may cause issues with the contract. Only use in emergency situations.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={finishGame} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finishing Game...
                    </>
                  ) : bypassChecks ? (
                    "Emergency Finish Game"
                  ) : forceFinish ? (
                    "Force Finish Game"
                  ) : (
                    "Finish Game"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  )
}

