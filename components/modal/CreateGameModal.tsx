// components/CreateGame.tsx

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePrivy } from "@privy-io/react-auth"
import { ethers } from 'ethers'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateGameProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateGame({ isOpen, onClose }: CreateGameProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = usePrivy()

  const handleCreateGroup = async () => {
    if (!user?.wallet?.address) return
    
    setIsLoading(true)
    setError(null)
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = await provider.getSigner()
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function registerMinter()',
          'function mint(address account, uint256 tokenId, bytes data)',
          'event NewGroup(uint256 indexed tokenId, address indexed minter)'
        ],
        signer
      )

      // Set up event listener before sending transaction
      contract.once('NewGroup', (tokenId, minter) => {
        if (minter.toLowerCase() === user.wallet?.address?.toLowerCase()) {
          setTokenId(tokenId.toString())
        }
      })

      // First register as minter
      const registerTx = await contract.registerMinter()
      const registerReceipt = await registerTx.wait()

      // Get the NewGroup event from the receipt to get the tokenId
      const newGroupEvent = registerReceipt.events?.find(
        (event: any) => event.event === 'NewGroup'
      )
      
      if (!newGroupEvent) {
        throw new Error('NewGroup event not found in transaction receipt')
      }

      const newTokenId = newGroupEvent.args.tokenId

      // Then mint a token for the user using the tokenId from the event
      const mintTx = await contract.mint(
        user.wallet.address,
        newTokenId,
        "0x" // Empty bytes as data
      )
      await mintTx.wait()
      
    } catch (error) {
      console.error('Error creating group:', error)
      setError('Failed to register. Please try again.')
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
                  <p className="text-red-500 mb-4">Error creating game: {error}</p>
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