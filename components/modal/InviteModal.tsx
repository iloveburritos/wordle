// components/InviteModal.tsx

'use client'

import React, { useState } from 'react'
import { Mail, Globe, Wallet, Share2, Plus, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resolveAddress } from "@/lib/utils"
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'
import { useWallets } from "@privy-io/react-auth"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Invite {
  id: number
  identifier: string
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { wallets } = useWallets()
  const [invites, setInvites] = useState<Invite[]>([{ id: 1, identifier: '' }])
  const [tokenId, setTokenId] = useState('')
  const [errors, setErrors] = useState<{ [key: number]: string }>({})
  const [tokenIdError, setTokenIdError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setInvites([{ id: 1, identifier: '' }])
    setTokenId('')
    setErrors({})
    setTokenIdError('')
    setIsLoading(false)
  }

  const handleClose = () => {
    if (!isLoading) {
      resetForm()
      onClose()
    }
  }

  const addInviteField = () => {
    if (invites[invites.length - 1].identifier && !errors[invites.length - 1]) {
      setInvites([...invites, { id: invites.length + 1, identifier: '' }])
    }
  }

  const handleIdentifierChange = (id: number, identifier: string) => {
    const updatedInvites = invites.map(invite =>
      invite.id === id ? { ...invite, identifier } : invite
    )
    setInvites(updatedInvites)
    validateIdentifier(id, identifier)
  }

  const handleTokenIdChange = (value: string) => {
    setTokenId(value)
    if (!value) {
      setTokenIdError('Token ID is required')
    } else if (!/^\d+$/.test(value)) {
      setTokenIdError('Token ID must be a number')
    } else {
      setTokenIdError('')
    }
  }

  const validateIdentifier = (id: number, identifier: string) => {
    const errorMessages = { ...errors }
  
    if (!identifier) {
      errorMessages[id] = 'Identifier cannot be empty'
    } else if (
      !/^0x[a-fA-F0-9]{40}$/.test(identifier) && // Wallet
      !identifier.endsWith('.eth') && // ENS
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) // Email
    ) {
      errorMessages[id] = 'Enter a valid wallet address, ENS domain, or email'
    } else {
      delete errorMessages[id]
    }
  
    setErrors(errorMessages)
  }

  async function handleSendInvites() {
    if (!tokenId || tokenIdError) {
      alert("Please enter a valid Token ID")
      return
    }

    if (Object.values(errors).some(error => error) || invites.some(invite => !invite.identifier)) {
      alert("Please fill out all fields correctly before sending invites.")
      return
    }

    setIsLoading(true)

    try {
      // First, deduplicate addresses during resolution
      const seenAddresses = new Set<string>()
      const resolvedInvites = await Promise.all(
        invites.map(async (invite) => {
          try {
            const resolvedAddress = await resolveAddress(invite.identifier)
            
            // Check if we've already seen this address
            if (seenAddresses.has(resolvedAddress.toLowerCase())) {
              return {
                ...invite,
                resolvedAddress: null,
                error: 'Duplicate address detected'
              }
            }
            
            seenAddresses.add(resolvedAddress.toLowerCase())
            return { ...invite, resolvedAddress, error: null }
          } catch (error) {
            return { 
              ...invite, 
              resolvedAddress: null, 
              error: error instanceof Error ? error.message : 'Resolution failed' 
            }
          }
        })
      )

      const resolutionErrors = resolvedInvites
        .filter(invite => invite.error)
        .map(invite => `${invite.identifier}: ${invite.error}`)

      const addressesToSend = resolvedInvites
        .filter((invite): invite is (typeof invite & { resolvedAddress: string }) => 
          invite.resolvedAddress !== null && invite.resolvedAddress !== undefined
        )
        .map((invite) => invite.resolvedAddress)

      if (addressesToSend.length === 0) {
        throw new Error("No valid addresses to send invites to.\n" + resolutionErrors.join('\n'))
      }

      // Replace the provider setup with Privy's wallet provider
      if (!wallets?.[0]) {
        throw new Error("No wallet available")
      }

      const provider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      )
      const signer = provider.getSigner()
      const address = await wallets[0].address

      // Get nonce from server
      const nonceResponse = await fetch('http://localhost:3001/generate-nonce')
      const { token, nonce } = await nonceResponse.json()

      // Create and sign SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: `Sign to verify ownership of token ${tokenId} and send invites`,
        uri: window.location.origin,
        version: '1',
        chainId: 84531,
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
        alert('Signature rejected. Please try again.')
        return
      }

      // Send invites to server
      const response = await fetch('http://localhost:3001/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddresses: addressesToSend,
          tokenId,
          message: messageString,
          signature,
          token,
          senderAddress: address
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to send invites')
      }

      // Define type for result items
      interface ResultItem {
        status: 'success' | 'skipped' | 'error';
      }

      // Show results summary
      const successCount = result.results.filter((r: ResultItem) => r.status === 'success').length
      const skippedCount = result.results.filter((r: ResultItem) => r.status === 'skipped').length
      const errorCount = result.results.filter((r: ResultItem) => r.status === 'error').length

      let resultMessage = `Successfully invited ${successCount} players to group ${tokenId}.`
      if (skippedCount > 0) resultMessage += `\n${skippedCount} already had access.`
      if (errorCount > 0) resultMessage += `\n${errorCount} failed to process.`

      alert(resultMessage)
      handleClose() // Only close after successful completion

    } catch (error) {
      console.error("Error in invite process:", error)
      alert(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] bg-black bg-opacity-80">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Invite to Play</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tokenId">Token ID</Label>
            <Input
              id="tokenId"
              placeholder="Enter Token ID"
              value={tokenId}
              onChange={(e) => handleTokenIdChange(e.target.value)}
              className="flex-grow"
              aria-invalid={tokenIdError ? "true" : "false"}
              disabled={isLoading}
            />
            {tokenIdError && (
              <p className="text-sm text-red-500">{tokenIdError}</p>
            )}
          </div>

          {invites.map((invite) => (
            <div key={invite.id} className="grid gap-2">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Wallet / ENS / Email"
                  value={invite.identifier}
                  onChange={(e) => handleIdentifierChange(invite.id, e.target.value)}
                  className="flex-grow"
                  aria-invalid={errors[invite.id] ? "true" : "false"}
                  aria-describedby={errors[invite.id] ? `error-${invite.id}` : undefined}
                  disabled={isLoading}
                />
              </div>
              {errors[invite.id] && (
                <p id={`error-${invite.id}`} className="text-sm text-red-500">{errors[invite.id]}</p>
              )}
            </div>
          ))}

          <Button
            onClick={addInviteField}
            variant="outline"
            className="w-full mt-2 border-none"
            disabled={!invites[invites.length - 1].identifier || !!errors[invites.length - 1] || isLoading}
          >
            <Plus className="mr-2 h-4 w-4" /> Invite another player
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Inviting players...</p>
            </div>
          ) : (
            <Button
              onClick={handleSendInvites}
              className="w-full mt-4"
              disabled={
                !tokenId || 
                !!tokenIdError || 
                Object.values(errors).some(error => error) || 
                invites.some(invite => !invite.identifier)
              }
            >
              <Share2 className="mr-2 h-4 w-4" /> Send Invites
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}