"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Bot, User, Clock, EyeOff } from "lucide-react"

interface VotingModalProps {
  players: string[]
  onVote: (selectedPlayer: string) => void
  timeLeft: number
  yourPlayerName?: string // Añadir el nombre del jugador actual
}

export function VotingModal({ players, onVote, timeLeft, yourPlayerName }: VotingModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Añadir un log para depuración
  useEffect(() => {
    console.log("VotingModal rendered with players:", players)
    console.log("Your player name:", yourPlayerName)
  }, [players, yourPlayerName])

  const handleVote = () => {
    if (!selectedPlayer) return
    setIsSubmitting(true)
    setTimeout(() => {
      onVote(selectedPlayer)
    }, 1500)
  }

  // Si no hay jugadores, mostrar un mensaje de error
  if (!players || players.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Error: No Players Available</CardTitle>
            <p className="text-center text-sm text-slate-400">
              No players are available to vote for. Please try refreshing the page.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort players by their number to maintain consistent order
  // Usar try-catch para manejar posibles errores en el formato del nombre
  const sortedPlayers = [...players].sort((a, b) => {
    try {
      const numA = Number.parseInt(a.split(" ")[1]) || 0
      const numB = Number.parseInt(b.split(" ")[1]) || 0
      return numA - numB
    } catch (error) {
      console.error("Error sorting players:", error)
      return 0
    }
  })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white w-full max-w-sm shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-500 rounded-full opacity-10"></div>
        <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-500 rounded-full opacity-10"></div>

        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl text-center flex items-center justify-center">
            <EyeOff className="h-5 w-5 text-purple-400 mr-2" />
            Time to Vote!
          </CardTitle>
          <p className="text-center text-sm text-slate-400 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1 text-primary animate-pulse" />
            <span className={timeLeft < 10 ? "text-red-400" : ""}>{timeLeft} seconds remaining</span>
          </p>
          {yourPlayerName && <p className="text-center text-sm text-primary">You are {yourPlayerName}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedPlayer || ""} onValueChange={setSelectedPlayer}>
            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map((player) => (
                <div
                  key={player}
                  className="flex items-center space-x-2 border border-slate-700 rounded-lg p-2 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <RadioGroupItem value={player} id={player} className="text-primary" />
                  <Label htmlFor={player} className="cursor-pointer text-sm flex items-center">
                    <div className="bg-slate-700 p-1 rounded-full mr-1 group-hover:bg-slate-600 transition-colors">
                      <User className="h-3 w-3 text-slate-300" />
                    </div>
                    {player}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 group"
            onClick={handleVote}
            disabled={!selectedPlayer || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Vote
                <Bot className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

