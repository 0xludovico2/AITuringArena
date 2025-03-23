"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SiteHeaderProps {
  showConfirmation?: boolean
}

export function SiteHeader({ showConfirmation = false }: SiteHeaderProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleLogoClick = (e: React.MouseEvent) => {
    if (showConfirmation) {
      e.preventDefault()
      setIsConfirmOpen(true)
    }
  }

  const handleConfirm = () => {
    router.push("/")
  }

  return (
    <header className="container mx-auto py-4">
      <div className="flex items-center">
        <Link href="/" onClick={handleLogoClick}>
          <div className="flex items-center space-x-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Turing%20Arena-dc7mZAHl16GUJ8bwbaTnYCuTxuLS4b.png"
              alt="AI Turing Arena Logo"
              width={40}
              height={40}
            />
            <h1 className="text-2xl font-bold">AI TURING ARENA</h1>
          </div>
        </Link>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de abandonar?</AlertDialogTitle>
            <AlertDialogDescription>
              Si abandonas la partida en curso, perderás tus fondos y no podrás reclamar ningún premio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Abandonar de todos modos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}

