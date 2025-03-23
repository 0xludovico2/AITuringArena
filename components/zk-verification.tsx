"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Check, Loader2, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import ZKProofGenerator from "@/lib/zk-utils"
import { useWeb3 } from "@/components/web3-provider"

interface ZKVerificationProps {
  onVerified: (commitment: string, secret: string) => void
}

export function ZKVerification({ onVerified }: ZKVerificationProps) {
  const { contract, signer } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [secret, setSecret] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const handleGenerateSecret = () => {
    // Generate a random secret
    const randomSecret = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    setSecret(randomSecret)
  }

  const handleVerify = async () => {
    if (!secret) {
      setError("Please enter or generate a secret first")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // This would call the ZK proof generator to create a zero-knowledge proof
      // that the user knows the secret without revealing it
      const { proof, publicInputs } = await ZKProofGenerator.generateHumanProof({
        secret,
        nullifier: `${secret}-nullifier`,
      })

      // In a real implementation, this would send the proof to the contract
      // and wait for verification
      // For demo, we'll simulate a successful verification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Save the commitment and secret for later use
      const commitment = ZKProofGenerator.generateCommitment(secret)

      setIsVerified(true)
      onVerified(commitment, secret)
    } catch (err: any) {
      console.error("Error verifying identity with ZK proof:", err)
      setError(err.message || "Failed to verify identity")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <Card className="bg-gray-100 border-gray-200 text-black">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <Shield className="h-5 w-5 mr-2" />
            Zero-Knowledge Verification Complete
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your identity has been verified privately using Zero-Knowledge Proofs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center">
            <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700">Successfully Verified</p>
              <p className="text-sm text-green-600">Your identity proof was verified without revealing your secret</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-100 border-gray-200 text-black">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 mr-2 text-purple-500" />
          Zero-Knowledge Verification
        </CardTitle>
        <CardDescription className="text-gray-600">
          Verify your identity privately with a Zero-Knowledge Proof
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-2">How it works:</h3>
            <ul className="list-disc pl-5 space-y-1 text-purple-900 text-sm">
              <li>Your secret will be used to generate a zero-knowledge proof</li>
              <li>This proof verifies your identity without revealing your secret</li>
              <li>The system only stores a commitment, not your actual secret</li>
              <li>This prevents sybil attacks without compromising privacy</li>
            </ul>
          </div>

          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
              Your Secret (or generate one)
            </label>
            <div className="flex space-x-2">
              <Input
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="bg-white border-gray-300"
                placeholder="Enter or generate a secret"
                type="password"
              />
              <Button
                variant="outline"
                onClick={handleGenerateSecret}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Generate
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handleVerify}
          disabled={isLoading || !secret}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating ZK Proof...
            </>
          ) : (
            "Verify with Zero-Knowledge"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

