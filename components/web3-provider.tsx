"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { ethers } from "ethers"
import { ZKSYNC_SEPOLIA_CONFIG, TURING_ARENA_CONTRACT_ADDRESS } from "@/lib/constants"
import turingArenaAbi from "@/lib/abi/turing-arena"

interface Web3ContextType {
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  chainId: number | null
  switchToZkSync: () => Promise<void>
  contract: ethers.Contract | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  chainId: null,
  switchToZkSync: async () => {},
  contract: null,
  provider: null,
  signer: null,
})

// zkSync Sepolia Testnet Chain ID
const ZKSYNC_TESTNET_CHAIN_ID = ZKSYNC_SEPOLIA_CONFIG.chainId

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  const setupContract = async (signer: ethers.JsonRpcSigner) => {
    try {
      // Usar el ABI completo en formato JSON en lugar del formato de strings
      const contract = new ethers.Contract(TURING_ARENA_CONTRACT_ADDRESS, turingArenaAbi, signer)

      // Verify the contract is valid by calling a simple view function
      try {
        await contract.owner()
        setContract(contract)
        return contract
      } catch (error) {
        console.error("Contract verification failed:", error)
        setContract(null)
        return null
      }
    } catch (error) {
      console.error("Failed to setup contract:", error)
      setContract(null)
      return null
    }
  }

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install a Web3 wallet like MetaMask to continue")
      return
    }

    try {
      setIsConnecting(true)
      setConnectionAttempts((prev) => prev + 1)

      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)

      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      setSigner(signer)

      const address = await signer.getAddress()
      setAddress(address)

      // Get current chain ID
      const network = await provider.getNetwork()
      setChainId(Number(network.chainId))

      // Setup contract if on the correct network
      if (Number(network.chainId) === ZKSYNC_TESTNET_CHAIN_ID) {
        await setupContract(signer)
      }

      // Add a visual delay for better UX
      setTimeout(() => {
        setIsConnecting(false)
      }, 800)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setContract(null)

    // Intentar limpiar localStorage si se está usando para persistencia
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletConnected")
      }
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  }

  const switchToZkSync = async () => {
    if (typeof window.ethereum === "undefined") return

    try {
      setIsConnecting(true)

      // First try to switch to the network if it's already added
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${ZKSYNC_TESTNET_CHAIN_ID.toString(16)}` }],
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${ZKSYNC_TESTNET_CHAIN_ID.toString(16)}`,
                  chainName: ZKSYNC_SEPOLIA_CONFIG.chainName,
                  nativeCurrency: ZKSYNC_SEPOLIA_CONFIG.nativeCurrency,
                  rpcUrls: ZKSYNC_SEPOLIA_CONFIG.rpcUrls,
                  blockExplorerUrls: ZKSYNC_SEPOLIA_CONFIG.blockExplorerUrls,
                },
              ],
            })

            // After adding, try to switch again
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${ZKSYNC_TESTNET_CHAIN_ID.toString(16)}` }],
            })
          } catch (addError) {
            console.error("Failed to add zkSync network:", addError)
            throw new Error("Could not add zkSync network to your wallet")
          }
        } else {
          console.error("Failed to switch network:", switchError)
          throw switchError
        }
      }

      // Update chainId after successful switch
      if (provider) {
        const network = await provider.getNetwork()
        setChainId(Number(network.chainId))

        // Setup contract after switching to correct network
        if (signer) {
          await setupContract(signer)
        }
      }

      // Add a visual delay for better UX
      setTimeout(() => {
        setIsConnecting(false)
      }, 800)
    } catch (error) {
      console.error("Network switch failed:", error)
      setIsConnecting(false)
      alert("Failed to switch to zkSync Sepolia Testnet. Please try adding it manually in your wallet.")
    }
  }

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)

      // Get current accounts
      provider.listAccounts().then(async (accounts) => {
        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          setSigner(signer)
          setAddress(accounts[0].address)

          // Setup contract if on the correct network
          const network = await provider.getNetwork()
          if (Number(network.chainId) === ZKSYNC_TESTNET_CHAIN_ID) {
            await setupContract(signer)
          }
        }
      })

      // Get current chain ID
      provider.getNetwork().then((network) => {
        setChainId(Number(network.chainId))
      })

      // Listen for account changes
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])

          // Update signer and contract
          const signer = await provider.getSigner()
          setSigner(signer)

          // Setup contract if on the correct network
          const network = await provider.getNetwork()
          if (Number(network.chainId) === ZKSYNC_TESTNET_CHAIN_ID) {
            await setupContract(signer)
          }
        } else {
          setAddress(null)
          setSigner(null)
          setContract(null)
        }
      })

      // Listen for chain changes
      window.ethereum.on("chainChanged", async (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        setChainId(newChainId)

        // Update contract if on the correct network
        if (newChainId === ZKSYNC_TESTNET_CHAIN_ID && signer) {
          await setupContract(signer)
        } else {
          setContract(null)
        }
      })
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        address,
        connect,
        disconnect,
        isConnecting,
        chainId,
        switchToZkSync,
        contract,
        provider,
        signer,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context)

