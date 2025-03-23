"use client"

import { useState } from "react"
import { WorldIDVerification } from "@/components/world-id-verification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export default function DemoPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [showContent, setShowContent] = useState(false)

  const handleVerified = () => {
    setIsVerified(true)
  }

  const resetVerification = () => {
    localStorage.removeItem("worldIdVerified")
    setIsVerified(false)
    setShowContent(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <SiteHeader />

      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold text-center mb-6">World ID Integration Demo</h1>

        {!isVerified ? (
          <WorldIDVerification onVerified={handleVerified} />
        ) : !showContent ? (
          <Card className="bg-gray-100 border-gray-200 text-black mb-4">
            <CardHeader>
              <CardTitle>Verification Successful!</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>You have successfully verified your identity with World ID.</p>
              <Button onClick={() => setShowContent(true)} className="bg-purple-600 hover:bg-purple-700">
                Continue to Protected Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-100 border-gray-200 text-black mb-4">
            <CardHeader>
              <CardTitle>Protected Content</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>This content is only visible to verified humans.</p>
              <p className="text-sm text-gray-600">
                In a real application, this could be access to a game, exclusive content, or other features that require
                human verification.
              </p>
            </CardContent>
          </Card>
        )}

        {isVerified && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={resetVerification}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Reset Verification (For Testing)
            </Button>
          </div>
        )}
      </div>
      <div className="mt-8">
        <Footer />
      </div>
    </div>
  )
}

