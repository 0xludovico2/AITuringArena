"use client"

import { useState, useEffect } from "react"

interface ZKIdentity {
  commitment: string | null
  secret: string | null
  storeIdentity: (commitment: string, secret: string) => void
  clearIdentity: () => void
  isVerified: boolean
}

export function useZKIdentity(): ZKIdentity {
  const [commitment, setCommitment] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean>(false)

  // Load identity from localStorage on mount
  useEffect(() => {
    try {
      const storedCommitment = localStorage.getItem("zk-commitment")
      const storedSecret = localStorage.getItem("zk-secret")

      if (storedCommitment && storedSecret) {
        setCommitment(storedCommitment)
        setSecret(storedSecret)
        setIsVerified(true)
      }
    } catch (error) {
      console.error("Error loading ZK identity from localStorage:", error)
    }
  }, [])

  // Store identity in localStorage
  const storeIdentity = (newCommitment: string, newSecret: string) => {
    try {
      localStorage.setItem("zk-commitment", newCommitment)
      localStorage.setItem("zk-secret", newSecret)

      setCommitment(newCommitment)
      setSecret(newSecret)
      setIsVerified(true)
    } catch (error) {
      console.error("Error storing ZK identity in localStorage:", error)
    }
  }

  // Clear identity from localStorage
  const clearIdentity = () => {
    try {
      localStorage.removeItem("zk-commitment")
      localStorage.removeItem("zk-secret")

      setCommitment(null)
      setSecret(null)
      setIsVerified(false)
    } catch (error) {
      console.error("Error clearing ZK identity from localStorage:", error)
    }
  }

  return {
    commitment,
    secret,
    storeIdentity,
    clearIdentity,
    isVerified,
  }
}

