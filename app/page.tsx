'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import ErrorModal from '@/components/modal/ErrorModal';
import InviteModal from '@/components/modal/InviteModal';
import CreateGame from '@/components/modal/CreateGameModal';
import StatsModal  from '@/components/modal/StatsModal';

export default function Home() {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)

  const handleAction = (action: string) => {
    if (!authenticated) {
      setIsErrorModalOpen(true)
    } else {
      if (action === 'play') {
        router.push('/game')
      } else if (action === 'team') {
        setIsInviteModalOpen(true)
      } else if (action === 'create') {
        setIsCreateGameModalOpen(true)
      }
      else if (action === 'stats') {
        setIsStatsModalOpen(true)
      }
    }
  }

  return (
    <div className="grid grid-rows-[1fr_auto] min-h-[calc(100vh-88px)] p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">Welcome to the on-chain Wordl3!</h1>
        <p className="text-sm sm:text-base">
          Share your score in a group chat, without the risk of giving away any hints or clues. Guaranteed way to know you&apos;re the best. Built with Next and for Ethereum. 
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => handleAction('play')}>
            Play Game
          </Button>
          <Button size="lg" onClick={() => handleAction('team')}>
            Invite Players
          </Button>
          <Button size="lg" onClick={() => handleAction('create')}>
            Create Game
          </Button>
          <Button size="lg" onClick={() => handleAction('stats')} variant="outline">
            View Stats
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
      <CreateGame 
        isOpen={isCreateGameModalOpen}
        onClose={() => setIsCreateGameModalOpen(false)}
      />
       <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />
    </div>
  )
}