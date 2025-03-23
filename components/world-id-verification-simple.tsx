"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WorldIDVerificationSimpleProps {
  onVerified: () => void
}

export function WorldIDVerificationSimple({ onVerified }: WorldIDVerificationSimpleProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [verificationStage, setVerificationStage] = useState<"qr" | "loading" | "complete">("qr")

  useEffect(() => {
    // Remove this code that checks for saved verification
    // const verified = localStorage.getItem("worldIdVerified") === "true"
    // if (verified) {
    //   setIsVerified(true)
    //   onVerified()
    // }

    // Instead, always start unverified
    setIsVerified(false)
  }, [onVerified])

  // Effect to handle automatic verification sequence
  useEffect(() => {
    if (!showQRDialog || verificationStage !== "qr") return

    // After 3 seconds, change to loading state
    const loadingTimer = setTimeout(() => {
      setVerificationStage("loading")

      // After 2 seconds more, complete the verification
      const completeTimer = setTimeout(() => {
        setVerificationStage("complete")

        // Small pause before closing the dialog
        setTimeout(() => {
          setShowQRDialog(false)
          setIsVerified(true)
          localStorage.setItem("worldIdVerified", "true")
          onVerified()
        }, 1000)
      }, 2000)

      return () => clearTimeout(completeTimer)
    }, 3000)

    return () => clearTimeout(loadingTimer)
  }, [showQRDialog, verificationStage, onVerified])

  const handleScanClick = () => {
    setVerificationStage("qr")
    setShowQRDialog(true)
  }

  if (isVerified) {
    return (
      <Card className="bg-gray-100 border-gray-200 text-black">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/worldcoin-org-wld-logo-fk1ehRBu4kBB99Re16Jzwl6nejASvK.png"
              alt="World ID Logo"
              width={24}
              height={24}
            />
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Verification Complete
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">Your identity has been verified with World ID</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-gray-100 border-gray-200 text-black">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Worldcoin_Logo-aA8eULBlCHQi2i8Df9MU0ez5hxVbBb.png"
              alt="Worldcoin Logo"
              width={120}
              height={24}
              className="dark:invert"
            />
          </div>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-500" />
            Verify Your Humanity
          </CardTitle>
          <CardDescription className="text-gray-600">
            To prevent bots and ensure fair gameplay, please verify with World ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-200 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Why verify?</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Ensures all players are unique humans</li>
                <li>• Prevents cheating and multiple accounts</li>
                <li>• Creates a fair gaming environment</li>
                <li>• Your privacy is protected with zero-knowledge proofs</li>
              </ul>
            </div>
            <Button
              onClick={handleScanClick}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              <Shield className="mr-2 h-4 w-4" />
              Scan QR Code to Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showQRDialog}
        onOpenChange={(open) => {
          if (!open) {
            // Only allow closing the dialog if we're not in the middle of the process
            if (verificationStage === "qr") {
              setShowQRDialog(false)
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2 mb-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/worldcoin-org-wld-logo-fk1ehRBu4kBB99Re16Jzwl6nejASvK.png"
                alt="World ID Logo"
                width={32}
                height={32}
              />
              <DialogTitle>World ID Verification</DialogTitle>
            </div>
            <DialogDescription>
              {verificationStage === "qr" && "Scan this QR with the World App"}
              {verificationStage === "loading" && "Verifying your identity..."}
              {verificationStage === "complete" && "Verification successful!"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {verificationStage === "qr" && (
              <div className="relative w-64 h-64">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202025-03-14%20030000-hcBJjaa246aLhyBWjlpY6Z1a0dgMSQ.png"
                  alt="World ID QR Code"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {verificationStage === "loading" && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
                <p className="mt-4 text-gray-600">Processing verification...</p>
              </div>
            )}

            {verificationStage === "complete" && (
              <div className="flex flex-col items-center justify-center h-64">
                <CheckCircle className="h-16 w-16 text-green-600" />
                <p className="mt-4 text-gray-600">Your identity has been verified!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

