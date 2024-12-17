// components/CreateGame.tsx

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ethers } from 'ethers'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiweMessage } from 'siwe'

interface CreateGameProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateGame({ isOpen, onClose }: CreateGameProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleCreateGroup = async () => {
    if (!user) {
      setError('Please login first')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Get wallet address based on login type
      let walletAddress: string | undefined
      
      if (user.email) {
        // For email users, fetch wallet from API
        const response = await fetch('/api/emailsToWallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email.address }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to get wallet address')
        }
        
        const data = await response.json()
        walletAddress = data.walletAddress
      } else {
        walletAddress = wallets[0]?.address
      }

      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      // Get provider for signing
      const provider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      )
      const signer = provider.getSigner()

      // Get nonce from server
      const nonceResponse = await fetch(`${apiUrl}/generate-nonce`)
      const { token, nonce } = await nonceResponse.json()

      // Create SIWE message with the nonce
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: walletAddress,
        statement: "Create new Wordle game group",
        uri: window.location.origin,
        version: '1',
        chainId: 84532,
        nonce: nonce
      })

      const messageString = siweMessage.prepareMessage()
      
      // Wrap the signing in a try-catch to handle user rejection
      let signature: string
      try {
        signature = await signer.signMessage(messageString)
      } catch (signError) {
        // If user rejects the signature, stop loading but keep modal open
        setIsLoading(false)
        setError('Signature rejected. Please try again.')
        return
      }

      // Send create group request to server
      const createResponse = await fetch(`${apiUrl}/create-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          message: messageString,
          signature,
          token
        }),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(error.error || 'Failed to create group')
      }

      const createData = await createResponse.json()
      setTokenId(createData.tokenId)
      
    } catch (error) {
      console.error('Error creating group:', error)
      setError(error instanceof Error ? error.message : 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  // Only close the modal when explicitly called by the user
  const handleClose = () => {
    // Only allow closing if we're not in the middle of creating a game
    if (!isLoading) {
      setTokenId(null)
      setError(null)
      onClose()
    }
  }

  return (
    // Force the modal to stay open while loading
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Wordle Group</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {tokenId ? (
            <div className="text-center">
              <p className="text-lg mb-4">
                Game created! Your game tokenId is <span className="font-semibold">{tokenId}</span>. 
                Use this tokenId to invite friends to the game.
              </p>
              <Button onClick={handleClose} className="mt-4">Done</Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={handleClose}>Done</Button>
                </div>
              )}
              {!error && (
                <Button 
                  onClick={handleCreateGroup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}