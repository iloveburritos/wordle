'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import ErrorModal from '@/components/error-modal'
import InviteModal from '@/components/invite-modal'

export default function Home() {
  const router = useRouter()
  const { ready, authenticated } = usePrivy()
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const handleAction = (action: string) => {
    if (!authenticated) {
      setIsErrorModalOpen(true)
    } else {
      if (action === 'play') {
        router.push('/game')
      } else if (action === 'team') {
        setIsInviteModalOpen(true)
      }
    }
  }

  return (
    <div className="grid grid-rows-[1fr_auto] min-h-[calc(100vh-88px)] p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">Welcome to on-chain Wordle!</h1>
        <p className="text-sm sm:text-base">
          An on-chain version of the popular NYT game, built with Next and for Ethereum. 
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => handleAction('play')}>
            Play Game
          </Button>
          <Button size="lg" onClick={() => handleAction('team')}>
            Start a Team
          </Button>
        </div>
      </main>
      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
      />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  )
}