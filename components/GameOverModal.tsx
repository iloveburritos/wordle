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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <pre>{grid}</pre>
        <DialogFooter className="sm:justify-start">
          <Button onClick={onShare}>Share</Button>
          <Button onClick={onSeeResults} variant="outline">See Results</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}