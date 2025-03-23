"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Check,
  X,
  Trophy,
  ArrowRight,
  Bot,
  User,
  Sparkles,
  PartyPopper,
  Coins,
  AlertTriangle,
  Users,
} from "lucide-react"
import confetti from "canvas-confetti"
import { SiteHeader } from "@/components/site-header"
import { useWeb3 } from "@/components/web3-provider"
import { getRandomPersonality } from "@/lib/ai-personalities"
import { TURING_ARENA_CONTRACT_ADDRESS } from "@/lib/constants"
import { Footer } from "@/components/footer"

// Constante para el número total de jugadores
const TOTAL_PLAYERS = 10

// Función para generar nombres de jugadores
const generatePlayerName = (index: number) => `Player ${index + 1}`

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contract } = useWeb3()

  const gameId = searchParams.get("gameId")
  const votedFor = searchParams.get("voted")

  const [showAI, setShowAI] = useState(false)
  const [showWinners, setShowWinners] = useState(false)
  const [showPrize, setShowPrize] = useState(false)
  const [aiPlayerName, setAiPlayerName] = useState<string>("")
  const [aiPersonality, setAiPersonality] = useState<{ name: string; prompt: string } | null>(null)
  const [userGuessedCorrectly, setUserGuessedCorrectly] = useState(false)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [correctGuesses, setCorrectGuesses] = useState(0)
  const [prizePool, setPrizePool] = useState(0)
  const [userPrize, setUserPrize] = useState(0)
  const [playerVotes, setPlayerVotes] = useState<{ [name: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [yourPlayerName, setYourPlayerName] = useState<string>("")
  const [aiDescription, setAiDescription] = useState<string>("")

  // Función para generar una descripción de la IA usando la API
  const generateAIDescription = async (personality: { name: string; prompt: string }) => {
    try {
      const response = await fetch("/api/ai-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [],
          prompt: `Generate a brief description (2-3 sentences) of an AI with this personality: "${personality.name}: ${personality.prompt}". Make it sound like you're revealing the AI's strategy.`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI description")
      }

      const data = await response.json()
      return (
        data.response ||
        `This AI was programmed with the "${personality.name}" personality, trying to blend in with human players.`
      )
    } catch (error) {
      console.error("Error generating AI description:", error)
      return `This AI was programmed with the "${personality.name}" personality, trying to blend in with human players.`
    }
  }

  useEffect(() => {
    const loadGameResults = async () => {
      if (!gameId) {
        setError("No game ID provided")
        return
      }

      try {
        // En un juego real, obtendríamos estos datos del contrato
        // Aquí simulamos los resultados

        // Generar array de jugadores simulados
        const simulatedPlayers = Array(TOTAL_PLAYERS)
          .fill(0)
          .map((_, i) => `0x${i}${i}${i}${i}${i}${i}`)

        // Obtener jugadores (simulados si no hay contrato)
        let players: string[] = []
        if (contract) {
          try {
            // Intentar obtener jugadores del contrato
            const contractPlayers = await contract.getPlayers(gameId)

            // Si hay jugadores en el contrato, usarlos
            if (contractPlayers && contractPlayers.length > 0) {
              players = contractPlayers
              // Asegurar que tenemos exactamente TOTAL_PLAYERS
              if (players.length < TOTAL_PLAYERS) {
                // Añadir jugadores simulados si faltan
                const additionalPlayers = simulatedPlayers.slice(0, TOTAL_PLAYERS - players.length)
                players = [...players, ...additionalPlayers]
              } else if (players.length > TOTAL_PLAYERS) {
                // Limitar a TOTAL_PLAYERS si hay demasiados
                players = players.slice(0, TOTAL_PLAYERS)
              }
            } else {
              // Si no hay jugadores en el contrato, usar simulados
              players = simulatedPlayers
            }
          } catch (error) {
            console.error("Error fetching players from contract:", error)
            // Fallback to simulated players
            players = simulatedPlayers
          }
        } else {
          // Simular jugadores si no hay contrato
          players = simulatedPlayers
        }

        // Asegurar que tenemos al menos 2 jugadores
        if (players.length < 2) {
          players = simulatedPlayers.slice(0, TOTAL_PLAYERS)
        }

        setTotalPlayers(players.length)

        // Asignar nombres a los jugadores
        const names: { [address: string]: string } = {}
        players.forEach((player: string, index: number) => {
          names[player.toLowerCase()] = generatePlayerName(index)
        })

        // Simular que uno de los jugadores es la IA (nunca el jugador actual)
        // Asegurar que el índice aleatorio está dentro del rango válido
        let randomIndex = 1 // Por defecto, el segundo jugador
        if (players.length > 2) {
          // Si hay más de 2 jugadores, elegir uno aleatorio que no sea el primero
          randomIndex = Math.floor(Math.random() * (players.length - 1)) + 1
        }

        // Asegurar que el índice está dentro del rango
        randomIndex = Math.min(randomIndex, players.length - 1)

        const aiPlayer = players[randomIndex]
        const aiName = names[aiPlayer.toLowerCase()] || "Player 2" // Fallback por si acaso
        setAiPlayerName(aiName)

        // Guardar el nombre del jugador actual (siempre el primer jugador)
        setYourPlayerName(names[players[0].toLowerCase()] || "Player 1") // Fallback por si acaso

        // Seleccionar una personalidad aleatoria para la IA
        const personality = getRandomPersonality()
        setAiPersonality(personality)

        // Generar descripción de la IA
        const aiDesc = await generateAIDescription(personality)
        setAiDescription(aiDesc)

        // Verificar si el usuario adivinó correctamente
        const didGuessCorrectly = votedFor === aiName
        setUserGuessedCorrectly(didGuessCorrectly)

        // Obtener detalles del juego (simulados si no hay contrato)
        let gamePrizePool = 0
        if (contract) {
          try {
            // En lugar de usar getGameDetails, estimamos el prize pool basado en el número de jugadores
            // Esto evita el error de decodificación
            gamePrizePool = 0.001 * players.length
          } catch (error) {
            console.error("Error estimating prize pool:", error)
            // Valor predeterminado si hay error
            gamePrizePool = 0.005 * players.length
          }
        } else {
          // Simular prize pool si no hay contrato
          gamePrizePool = 0.005 * players.length
        }

        setPrizePool(gamePrizePool)

        // Simular número de aciertos y votos
        const simulatedCorrectGuesses = Math.floor(Math.random() * 4) + 1
        setCorrectGuesses(simulatedCorrectGuesses)

        // Simular votos de los jugadores
        const votes: { [name: string]: number } = {}
        Object.values(names).forEach((name) => {
          votes[name] = Math.floor(Math.random() * 3)
        })
        // Asegurar que el AI reciba algunos votos
        votes[aiName] = simulatedCorrectGuesses
        setPlayerVotes(votes)

        // Calcular premio del usuario
        if (didGuessCorrectly) {
          const prize = Math.floor((gamePrizePool * 1000) / simulatedCorrectGuesses) / 1000
          setUserPrize(prize)
        }
      } catch (error) {
        console.error("Error loading game results:", error)
        setError("Failed to load game results. Please try again.")
      }
    }

    loadGameResults()
  }, [contract, gameId, votedFor])

  useEffect(() => {
    // Reveal the AI after 2 seconds
    const timer1 = setTimeout(() => {
      setShowAI(true)
    }, 2000)

    // Show winners after 4 seconds
    const timer2 = setTimeout(() => {
      setShowWinners(true)
    }, 4000)

    // Show prize after 6 seconds
    const timer3 = setTimeout(() => {
      setShowPrize(true)

      // If user won, trigger confetti
      if (userGuessedCorrectly) {
        try {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#a855f7", "#3b82f6", "#ec4899"],
          })

          // Add a second burst of confetti after a short delay
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.65 },
              colors: ["#a855f7", "#3b82f6", "#ec4899"],
            })

            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.65 },
              colors: ["#a855f7", "#3b82f6", "#ec4899"],
            })
          }, 800)
        } catch (error) {
          console.error("Error with confetti:", error)
        }
      }
    }, 6000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [userGuessedCorrectly])

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
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
          <Sparkles className="h-6 w-6 mr-2 text-purple-500" />
          Game Results
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-600 mr-2" />
              The AI Agent Was...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {showAI ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-purple-100 p-3 rounded-full shadow-md">
                    <Bot className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold ml-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                    {aiPlayerName}
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-lg shadow-sm border border-slate-200">
                  <p className="font-medium mb-1">AI Personality:</p>
                  <p className="italic text-purple-700">{aiPersonality?.name || "Unknown"}</p>
                  <p className="mt-2 text-xs text-slate-500">{aiDescription}</p>
                </div>
                <div className="flex justify-center">
                  {userGuessedCorrectly ? (
                    <div className="flex items-center text-green-500 bg-green-50 px-4 py-2 rounded-full shadow-sm border border-green-100">
                      <Check className="mr-2 h-5 w-5" />
                      <span>You guessed correctly!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 bg-red-50 px-4 py-2 rounded-full shadow-sm border border-red-100">
                      <X className="mr-2 h-5 w-5" />
                      <span>You guessed incorrectly</span>
                    </div>
                  )}
                </div>
                {yourPlayerName && <div className="mt-3 text-sm text-primary">You played as {yourPlayerName}</div>}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {showWinners && (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 animate-fade-in shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                Player Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4 bg-gradient-to-br from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-100 shadow-sm">
                <span className="text-2xl font-bold text-purple-600">{correctGuesses}</span>
                <span className="text-lg"> out of </span>
                <span className="text-2xl font-bold text-blue-600">{totalPlayers}</span>
                <span className="text-lg"> players guessed correctly</span>
              </div>

              {Object.entries(playerVotes).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2 text-gray-700">Votes received:</p>
                  <div className="space-y-2">
                    {Object.entries(playerVotes)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, votes]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow transition-all duration-300"
                        >
                          <div className="flex items-center">
                            {name === aiPlayerName ? (
                              <div className="bg-purple-100 p-1 rounded-full mr-1">
                                <Bot className="h-4 w-4 text-purple-600" />
                              </div>
                            ) : name === yourPlayerName ? (
                              <div className="bg-blue-100 p-1 rounded-full mr-1">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                            ) : (
                              <div className="bg-gray-100 p-1 rounded-full mr-1">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            <span
                              className={
                                name === aiPlayerName
                                  ? "font-medium text-purple-700"
                                  : name === yourPlayerName
                                    ? "font-medium text-blue-700"
                                    : ""
                              }
                            >
                              {name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-gray-200 h-2 w-24 rounded-full mr-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  name === aiPlayerName
                                    ? "bg-gradient-to-r from-purple-500 to-purple-700"
                                    : name === yourPlayerName
                                      ? "bg-gradient-to-r from-blue-500 to-blue-700"
                                      : "bg-gradient-to-r from-gray-400 to-gray-600"
                                }`}
                                style={{
                                  width: `${(votes / Math.max(...Object.values(playerVotes))) * 100}%`,
                                  transition: "width 1s ease-out",
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{votes}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showPrize && (
          <Card
            className={`bg-gradient-to-br from-white to-gray-50 border-gray-200 text-black mb-6 animate-fade-in shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden ${userGuessedCorrectly ? "border-primary border-2" : ""}`}
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>

            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                {userGuessedCorrectly && <Trophy className="h-5 w-5 text-yellow-500 mr-2 animate-pulse" />}
                Prize Distribution
                {userGuessedCorrectly && <Trophy className="h-5 w-5 text-yellow-500 ml-2 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {userGuessedCorrectly ? (
                <div>
                  <div className="text-sm mb-2 flex items-center justify-center">
                    <PartyPopper className="h-5 w-5 text-yellow-500 mr-2 animate-pulse" />
                    <span>You won:</span>
                  </div>
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500 mb-2 flex items-center justify-center">
                    <Coins className="h-6 w-6 mr-2 text-yellow-500" />
                    {userPrize} ETH
                  </div>
                  <div className="text-sm text-slate-400 mb-2 bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200 shadow-sm">
                    {gameId ? (
                      <>En una implementación completa, este premio sería enviado automáticamente a tu billetera.</>
                    ) : (
                      "Este es un juego de demostración. No se han enviado fondos reales."
                    )}
                  </div>
                  {gameId && (
                    <div className="mt-2">
                      <a
                        href={`https://sepolia.explorer.zksync.io/address/${TURING_ARENA_CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center justify-center transition-colors"
                      >
                        Ver contrato en el explorador de bloques
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm mb-2">Better luck next time!</div>
                  <div className="text-lg p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 shadow-sm">
                    You didn't win any prize this round
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => router.push("/games")}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            Play Again <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  )
}

