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

      const tx = await contract.registerMinter()
      await tx.wait()
      
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
              <p className="text-green-500 font-semibold mb-4">Successfully Registered!</p>
              <p>Your Token ID: {tokenId}</p>
              <Button onClick={handleClose} className="mt-4">Close</Button>
            </div>
          ) : (
            <>
              {error && <p className="text-red-500 text-sm">{error}</p>}
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}