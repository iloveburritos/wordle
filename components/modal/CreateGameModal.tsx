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
      const nonceResponse = await fetch("http://localhost:3001/generate-nonce")
      const { token, nonce } = await nonceResponse.json() // Get both token and nonce

      // Create SIWE message with the nonce (not the token)
      const message = new SiweMessage({
        domain: window.location.host,
        address: walletAddress,
        statement: "Create new Wordle game group",
        uri: window.location.origin,
        version: '1',
        chainId: 84532, // Base Sepolia
        nonce: nonce // Use the nonce, not the token
      })

      const messageString = message.prepareMessage()
      const signature = await signer.signMessage(messageString)

      // Send create group request to server with both token and message
      const createResponse = await fetch("http://localhost:3001/create-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          message: messageString,
          signature,
          token // Send the JWT token separately
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

  const handleClose = () => {
    setTokenId(null)
    setError(null)
    onClose()
  }

  return (
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