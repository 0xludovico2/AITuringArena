"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Brain, ShieldCheck, Lock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export default function HomePageWithZK() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <header className="container mx-auto py-6">
        <div className="flex items-center justify-between">
          <SiteHeader />
          <div className="flex space-x-2">
            <Link href="/admin">
              <Button variant="outline" className="text-black border-black hover:bg-black/10">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Link href="/games">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">Play Now</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-10">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Turing%20Arena-dc7mZAHl16GUJ8bwbaTnYCuTxuLS4b.png"
              alt="AI Turing Arena Logo"
              width={200}
              height={200}
              className="mx-auto"
            />
            <h2 className="text-6xl font-bold mt-6 mb-4">AI TURING ARENA</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The ultimate social deduction game where humans and AI compete - now with Zero-Knowledge Proofs!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl w-full">
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
              <Lock className="h-10 w-10 mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-2">Zero-Knowledge</h3>
              <p className="text-gray-600 text-center">
                Private identity verification and anonymous voting using ZK proofs
              </p>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
              <Brain className="h-10 w-10 mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-2">Spot the AI</h3>
              <p className="text-gray-600 text-center">Chat for 1 minute, then vote on who you think is the AI agent</p>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
              <Trophy className="h-10 w-10 mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-2">Win Prizes</h3>
              <p className="text-gray-600 text-center">Correctly identify the AI to win a share of the prize pool</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl border border-purple-200 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <ShieldCheck className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Enhanced with Zero-Knowledge Proofs</h3>
            <p className="text-gray-600 text-center">
              Our game now uses zkSync's Zero-Knowledge technology to enhance privacy and security, allowing for
              anonymous voting and private identity verification.
            </p>
          </div>

          <Link href="/lobby?useZK=true">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
              Start Playing with ZK <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <Link href="/learn/zk" className="mt-4">
            <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
              Learn about Zero-Knowledge Proofs
            </Button>
          </Link>
        </div>
      </main>

      <footer className="container mx-auto py-4 text-center text-gray-500 border-t border-gray-200">
        <p>Running on zkSync Sepolia Testnet • Secured with Zero-Knowledge Proofs</p>
        <p className="mt-2">
          <a
            href="https://sepolia.explorer.zksync.io/address/0x2223A4470A98Eebd4cAD7FF5AAf80044491F4C0D"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline"
          >
            Contract: 0x2223A4470A98Eebd4cAD7FF5AAf80044491F4C0D
          </a>
        </p>
        <div className="mt-2">
          <Footer />
        </div>
      </footer>
    </div>
  )
}

