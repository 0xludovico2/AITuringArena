"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Lock, Shield, EyeOff } from "lucide-react"

export default function ZKLearnPage() {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-purple-600 hover:underline flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Zero Knowledge Proofs & zkSync</h1>
            <p className="text-xl text-gray-600">
              Understanding the technology that powers our blockchain infrastructure
            </p>
          </div>

          <Tabs defaultValue="basics" className="mb-12">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="basics">ZK Basics</TabsTrigger>
              <TabsTrigger value="zksync">zkSync</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="future">Future of ZK</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">What are Zero Knowledge Proofs?</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="mb-4">
                      Zero Knowledge Proofs (ZKPs) are cryptographic methods that allow one party (the prover) to prove
                      to another party (the verifier) that a statement is true, without revealing any information beyond
                      the validity of the statement itself.
                    </p>
                    <p className="mb-4">
                      In simpler terms, ZKPs let you prove you know something without showing what that something is.
                    </p>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-4">
                      <h3 className="font-bold text-purple-800 mb-2">Key Properties of ZKPs:</h3>
                      <ul className="list-disc pl-5 space-y-1 text-purple-900">
                        <li>
                          <strong>Completeness:</strong> If the statement is true, an honest verifier will be convinced
                          by an honest prover.
                        </li>
                        <li>
                          <strong>Soundness:</strong> If the statement is false, no cheating prover can convince an
                          honest verifier that it is true.
                        </li>
                        <li>
                          <strong>Zero-Knowledge:</strong> The verifier learns nothing other than the fact that the
                          statement is true.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="bg-gray-100 rounded-lg p-6 relative">
                      <div className="flex items-center justify-center mb-8">
                        <div className="bg-purple-100 rounded-full p-4">
                          <Lock className="h-12 w-12 text-purple-600" />
                        </div>
                        <div className="mx-4 text-2xl font-bold text-gray-400">→</div>
                        <div className="bg-green-100 rounded-full p-4">
                          <Shield className="h-12 w-12 text-green-600" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="font-bold mb-1">Prover</p>
                          <p className="text-sm text-gray-600">"I know the secret"</p>
                        </div>
                        <div>
                          <p className="font-bold mb-1">Verifier</p>
                          <p className="text-sm text-gray-600">"Proof verified!"</p>
                        </div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-white rounded-full p-2 shadow-md">
                          <EyeOff className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      The verifier is convinced without seeing the secret
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">A Simple Example: The Cave of Alibaba</h2>
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="mb-4">
                        Imagine a circular cave with a door that can only be opened with a secret password. The cave has
                        a fork with paths A and B, both leading to the same dead end.
                      </p>
                      <p className="mb-4">
                        Peggy wants to prove to Victor that she knows the password, without revealing it to him.
                      </p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Victor waits outside while Peggy enters the cave.</li>
                        <li>Peggy takes either path A or B (her choice).</li>
                        <li>Victor enters and shouts which path he wants Peggy to come out from: A or B.</li>
                        <li>
                          If Peggy knows the password, she can always come out from the requested path (using the door
                          if needed).
                        </li>
                        <li>If she doesn't know the password, she has only a 50% chance of success.</li>
                      </ol>
                      <p className="mt-4">
                        By repeating this process multiple times, Victor becomes convinced that Peggy knows the
                        password, without Peggy ever revealing it.
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative w-full max-w-xs">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/zk-cave-example-Rl9Iy9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9"
                          alt="ZK Cave Example"
                          width={300}
                          height={200}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="zksync" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">What is zkSync?</h2>
                <p className="mb-4">
                  zkSync is a Layer 2 scaling solution for Ethereum that uses zero-knowledge proofs to increase
                  transaction throughput and reduce gas fees while inheriting the security of Ethereum.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mt-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-3 text-blue-800">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2 text-blue-900">
                      <li>
                        <strong>High Throughput:</strong> Processes thousands of transactions per second
                      </li>
                      <li>
                        <strong>Low Fees:</strong> Reduces gas costs by batching transactions
                      </li>
                      <li>
                        <strong>Security:</strong> Inherits Ethereum's security through ZK proofs
                      </li>
                      <li>
                        <strong>EVM Compatible:</strong> Supports Ethereum smart contracts
                      </li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-3 text-purple-800">How It Works</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-purple-900">
                      <li>Transactions are submitted to zkSync validators</li>
                      <li>Validators batch transactions and compute ZK proofs</li>
                      <li>Proofs are submitted to Ethereum mainnet</li>
                      <li>Ethereum verifies proofs, ensuring transaction validity</li>
                      <li>State is updated on both zkSync and Ethereum</li>
                    </ol>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="applications" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Applications of Zero-Knowledge Proofs</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-3 text-purple-800">Privacy-Preserving Identity</h3>
                    <p className="text-gray-700">
                      Prove your identity or credentials without revealing personal information. Examples include age
                      verification without showing your birthdate.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-3 text-blue-800">Private Transactions</h3>
                    <p className="text-gray-700">
                      Conduct financial transactions with privacy. Prove you have sufficient funds without revealing
                      your balance or transaction history.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-lg p-6 border border-green-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-3 text-green-800">Scalable Blockchains</h3>
                    <p className="text-gray-700">
                      ZK-Rollups like zkSync batch thousands of transactions into a single proof, dramatically
                      increasing throughput while maintaining security.
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="future" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">The Future of Zero-Knowledge Technology</h2>
                <p className="mb-6">
                  Zero-Knowledge proofs are rapidly evolving and will likely transform many aspects of digital
                  interaction. Here are some emerging trends and future applications:
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-2">ZK for Web3 Identity</h3>
                      <p className="text-gray-700">
                        Universal identity systems that allow selective disclosure of information, enabling privacy
                        while maintaining trust in digital interactions.
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2">Private Smart Contracts</h3>
                      <p className="text-gray-700">
                        Next-generation smart contracts that keep inputs, outputs, and state private while still being
                        verifiable by the network.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-800 mb-2">ZK Machine Learning</h3>
                      <p className="text-gray-700">
                        Proving ML model properties or results without revealing the model itself, enabling
                        collaborative AI while protecting intellectual property.
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                      <h3 className="font-bold text-amber-800 mb-2">Interoperability Solutions</h3>
                      <p className="text-gray-700">
                        ZK proofs enabling secure cross-chain communication and verification, creating a more connected
                        blockchain ecosystem.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

