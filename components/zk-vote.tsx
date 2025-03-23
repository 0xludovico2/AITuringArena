"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, EyeOff } from "lucide-react"
import ZKProofGenerator from "@/lib/zk-utils"
import { useWeb3 } from "@/components/web3-provider"

interface ZKVoteModalProps {
  players: string[]
  onVote: (selectedPlayer: string) => void
  timeLeft: number
  yourPlayerName?: string
  gameId: number
  userSecret: string
}

export function ZKVoteModal({ players, onVote, timeLeft, yourPlayerName, gameId, userSecret }: ZKVoteModalProps) {
  const { contract, signer } = useWeb3()
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVote = async () => {
    if (!selectedPlayer) return

    try {
      setIsSubmitting(true)
      setError(null)

      // In a real implementation, this would generate an actual zk-proof
      // The proof would demonstrate that:
      // 1. The voter is a valid player (knows the secret for their commitment)
      // 2. The voter has not voted before (using the nullifier)
      // 3. The vote is for a valid player
      const { proof, publicInputs } = await ZKProofGenerator.generateVoteProof(
        {
          secret: userSecret,
          nullifier: `${userSecret}-vote-${gameId}`,
        },
        gameId,
        selectedPlayer,
      )

      // In a real implementation, this would call the contract to submit the vote
      // For demo, we'll simulate a transaction delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onVote(selectedPlayer)
    } catch (err: any) {
      console.error("Error submitting vote with ZK proof:", err)
      setError(err.message || "Failed to submit vote")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no players, show an error
  if (!players || players.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <Card className="bg-slate-800 border-slate-700 text-white w-full max-w-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Error: No Players Available</CardTitle>
            <p className="text-center text-sm text-slate-400">
              No players are available to vote for. Please try refreshing the page.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort players for consistent order
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
      <Card className="bg-slate-800 border-slate-700 text-white w-full max-w-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center space-x-2">
            <EyeOff className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-xl">Private ZK Voting</CardTitle>
          </div>
          <p className="text-center text-sm text-slate-400">{timeLeft} seconds remaining</p>
          {yourPlayerName && <p className="text-center text-sm text-primary">You are {yourPlayerName}</p>}
          <p className="text-center text-xs text-purple-400 mt-1">
            Your vote will be anonymous using Zero-Knowledge Proofs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded text-sm">{error}</div>
          )}

          <RadioGroup value={selectedPlayer || ""} onValueChange={setSelectedPlayer}>
            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map((player) => (
                <div key={player} className="flex items-center space-x-2 border border-slate-700 rounded-lg p-2">
                  <RadioGroupItem value={player} id={player} className="text-primary" />
                  <Label htmlFor={player} className="cursor-pointer text-sm">
                    {player}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button className="w-full" onClick={handleVote} disabled={!selectedPlayer || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating ZK Proof...
              </>
            ) : (
              "Submit Anonymously"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

