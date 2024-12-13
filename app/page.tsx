'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import NoWalletModal from '@/components/modal/NoWalletModal'
import InviteModal from '@/components/modal/InviteModal'
import CreateGame from '@/components/modal/CreateGameModal'
import ViewScoresButton from '@/components/ViewScoresButton'
import AlreadyPlayedModal from '@/components/modal/AlreadyPlayedModal'
import { checkHasPlayed } from '@/lib/utils'


export default function Home() {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [isNoWalletModalOpen, setIsNoWalletModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false)
  const [isAlreadyPlayedModalOpen, setIsAlreadyPlayedModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: string) => {
    // Step 1: Check if wallet is connected
    if (!authenticated || !wallets?.[0]) {
      setIsNoWalletModalOpen(true)
      return
    }

    // Handle non-game actions directly
    if (action === 'team') {
      setIsInviteModalOpen(true)
      return
    } else if (action === 'create') {
      setIsCreateGameModalOpen(true)
      return
    }

    // Handle game start flow
    if (action === 'play') {
      setIsLoading(true)
      try {
        // Step 2: Check if user has already played
        const hasPlayed = await checkHasPlayed(wallets[0].address)
        
        if (hasPlayed) {
          // User has already played, show modal
          setIsAlreadyPlayedModalOpen(true)
        } else {
          // Step 3: User hasn't played, redirect to game
          router.push('/game')
        }
      } catch (error) {
        console.error('Error checking game status:', error)
        alert('Error checking game status. Please try again.')
      } finally {
        setIsLoading(false)
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
          <Button 
            size="lg" 
            onClick={() => handleAction('play')}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Play Game'}
          </Button>
          <Button size="lg" onClick={() => handleAction('team')}>
            Invite Players
          </Button>
          <Button size="lg" onClick={() => handleAction('create')}>
            Create Game
          </Button>
          <ViewScoresButton 
  variant="outline" 
  className="h-11"
  label="See Results"
  onError={(error) => alert(error)} 
/>
        </div>
      </main>
      
      <NoWalletModal 
        isOpen={isNoWalletModalOpen} 
        onClose={() => setIsNoWalletModalOpen(false)} 
      />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <CreateGame 
        isOpen={isCreateGameModalOpen}
        onClose={() => setIsCreateGameModalOpen(false)}
      />
      <AlreadyPlayedModal
        isOpen={isAlreadyPlayedModalOpen}
        onClose={() => setIsAlreadyPlayedModalOpen(false)}
      />
    </div>
  )
}