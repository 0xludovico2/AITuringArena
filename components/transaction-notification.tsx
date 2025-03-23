"use client"

import { useState, useEffect } from "react"
import { X, ExternalLink, CheckCircle } from "lucide-react"
import { ZKSYNC_SEPOLIA_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"

interface TransactionNotificationProps {
  hash: string
  message: string
  onClose: () => void
}

export function TransactionNotification({ hash, message, onClose }: TransactionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const explorerUrl = `${ZKSYNC_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${hash}`

  // Auto-close after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-slide-in-right">
      <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-lg border border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 flex justify-between items-center border-b border-green-100">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium text-green-800">Transaction Successful</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">{message}</p>
          <div className="bg-white p-2 rounded border border-gray-200 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Transaction Hash:</span>
              <span className="text-xs font-mono text-gray-700 truncate max-w-[200px]">{hash}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50 transition-colors group"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

