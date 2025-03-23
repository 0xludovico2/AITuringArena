"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { Loader2 } from "lucide-react"

export function GameHeader() {
  const { address, connect, disconnect, isConnecting } = useWeb3()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="container mx-auto py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Turing%20Arena-dc7mZAHl16GUJ8bwbaTnYCuTxuLS4b.png"
            alt="AI Turing Arena Logo"
            width={40}
            height={40}
          />
          <h1 className="text-2xl font-bold">AI TURING ARENA</h1>
        </div>

        {address ? (
          <Button variant="outline" className="text-black border-black hover:bg-black/10" onClick={disconnect}>
            {formatAddress(address)}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="text-black border-black hover:bg-black/10"
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
        )}
      </div>
    </header>
  )
}

