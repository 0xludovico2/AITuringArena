import { ExternalLink } from "lucide-react"
import { ZKSYNC_SEPOLIA_CONFIG } from "@/lib/constants"

interface TransactionHashProps {
  hash: string
}

export function TransactionHash({ hash }: TransactionHashProps) {
  const explorerUrl = `${ZKSYNC_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${hash}`

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-green-100 p-1 rounded-full mr-2">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-gray-700">Transaction Submitted</span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center transition-colors"
        >
          View
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
      <div className="mt-2">
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Transaction Hash:</span>
            <span className="text-xs font-mono text-gray-700 truncate max-w-[200px]">{hash}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

