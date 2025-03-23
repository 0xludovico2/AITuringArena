import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Trophy, Brain, ShieldCheck, Lock, Sparkles, Bot, User } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <header className="container mx-auto py-3 relative z-10">
        <div className="flex items-center justify-between">
          <SiteHeader />
          <div className="flex space-x-2">
            <Link href="/admin">
              <Button
                variant="outline"
                className="text-black border-black hover:bg-black/10 transition-all duration-300 hover:scale-105"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 py-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="mb-5 relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-20 animate-pulse"></div>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Turing%20Arena-dc7mZAHl16GUJ8bwbaTnYCuTxuLS4b.png"
              alt="AI Turing Arena Logo"
              width={150}
              height={150}
              className="mx-auto relative animate-float"
            />
            <h2 className="text-4xl font-bold mt-4 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              AI TURING ARENA
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The ultimate social deduction game where humans and AI compete. Can you tell who's who?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6 max-w-4xl w-full">
            <div className="bg-gradient-to-br from-white to-gray-100 p-4 rounded-lg border border-gray-200 flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">10 Players</h3>
              <p className="text-gray-600 text-center text-sm">
                Join a game with 10 players, where one of them (including possibly you!) will be the AI
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-100 p-4 rounded-lg border border-gray-200 flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Spot the AI</h3>
              <p className="text-gray-600 text-center text-sm">
                Chat for 1 minute, then vote on who you think is the AI agent
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-100 p-4 rounded-lg border border-gray-200 flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Win Prizes</h3>
              <p className="text-gray-600 text-center text-sm">
                Correctly identify the AI to win a share of the prize pool
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6 max-w-4xl mx-auto w-full">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-200 rounded-full opacity-30"></div>
              <div className="absolute -left-6 -bottom-6 w-12 h-12 bg-blue-200 rounded-full opacity-30"></div>
              <div className="flex items-center justify-center mb-2">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-1">Verified by World ID</h3>
              <p className="text-gray-600 text-center text-sm">
                All players are verified as unique humans using World ID technology, ensuring fair gameplay and
                preventing bots.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-12 h-12 bg-purple-200 rounded-full opacity-30"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-blue-200 rounded-full opacity-30"></div>
              <div className="flex items-center justify-center mb-2">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-1">Enhanced with ZK Proofs</h3>
              <p className="text-gray-600 text-center text-sm">
                We use Zero-Knowledge Proofs technology to enhance privacy and security, enabling anonymous voting,
                secure AI player selection, and private wallet participation without revealing identities.
              </p>
            </div>
          </div>

          <Link href="/games">
            <Button
              size="default"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              Start Playing
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden mt-6 shadow-md relative">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-white relative">
            <h3 className="text-lg font-bold flex items-center">
              <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              How to Play
            </h3>
          </div>

          <div className="p-4 relative">
            <div className="absolute right-4 bottom-4 opacity-5">
              <Bot className="h-24 w-24 text-purple-900" />
            </div>

            <ol className="space-y-2 text-sm relative z-10">
              <li className="flex items-start group">
                <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  1
                </span>
                <span className="group-hover:text-purple-700 transition-colors">
                  Verify your identity with World ID to ensure you're a unique human
                </span>
              </li>
              <li className="flex items-start group">
                <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  2
                </span>
                <span className="group-hover:text-purple-700 transition-colors">
                  Connect your wallet and buy a ticket for 0.001 ETH on zkSync Sepolia
                </span>
              </li>
              <li className="flex items-start group">
                <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  3
                </span>
                <span className="group-hover:text-purple-700 transition-colors">
                  Chat with everyone for 1 minute - one participant is an AI agent
                </span>
              </li>
              <li className="flex items-start group">
                <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  4
                </span>
                <span className="group-hover:text-purple-700 transition-colors">
                  Vote on who you think is the AI during the 30-second voting phase
                </span>
              </li>
              <li className="flex items-start group">
                <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  5
                </span>
                <span className="group-hover:text-purple-700 transition-colors">
                  If you guess correctly, you split the prize pool with other winners!
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Animated players */}
        <div className="hidden md:block">
          <div className="absolute left-0 top-1/4 animate-float-slow opacity-20">
            <User className="h-12 w-12 text-purple-400" />
          </div>
          <div className="absolute right-10 top-1/3 animate-float-delay opacity-20">
            <User className="h-10 w-10 text-blue-400" />
          </div>
          <div className="absolute left-1/4 bottom-1/4 animate-float opacity-20">
            <Bot className="h-14 w-14 text-purple-500" />
          </div>
          <div className="absolute right-1/4 bottom-1/3 animate-float-slow opacity-20">
            <User className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </main>

      <footer className="container mx-auto py-3 text-center text-gray-500 border-t border-gray-200 text-sm relative z-10">
        <p>Running on zkSync Sepolia Testnet • Prize pool protected by smart contracts</p>
        <p className="mt-1">
          <a
            href="https://sepolia.explorer.zksync.io/address/0xB5F25B62A5d8BcFb65bAA60f6247162B524c2622"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline hover:text-purple-700 transition-colors"
          >
            Contract: 0xB5F25B62A5d8BcFb65bAA60f6247162B524c2622
          </a>
        </p>
        <div className="mt-1">
          <Footer />
        </div>
      </footer>
    </div>
  )
}

