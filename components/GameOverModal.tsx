// components/GameOverModal.tsx

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GameOverModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: () => void
  onSeeResults: () => void
  score: number
  totalAttempts: number
  message: string
  grid: string
}

export default function GameOverModal({
  isOpen,
  onClose,
  onShare,
  onSeeResults,
  score,
  totalAttempts,
  message,
  grid
}: GameOverModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <pre>{grid}</pre>
        <DialogFooter className="sm:justify-start">
          <Button onClick={onShare}>Share</Button>
          <Button onClick={onSeeResults} variant="outline">See Stats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}