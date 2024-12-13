// components/invite-modal.tsx

'use client'

import React, { useState } from 'react'
import { Mail, Globe, Wallet, Share2, Plus, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resolveAddress } from "@/lib/utils"
import { ethers } from 'ethers'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Invite {
  id: number
  identifier: string
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
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
    resetForm()
    onClose()
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
            console.log(`Resolving address for: ${invite.identifier}`)
            const resolvedAddress = await resolveAddress(invite.identifier)
            console.log(`Successfully resolved ${invite.identifier} to ${resolvedAddress}`)
            
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
            console.error(`Failed to resolve ${invite.identifier}:`, error)
            return { 
              ...invite, 
              resolvedAddress: null, 
              error: error instanceof Error ? error.message : 'Resolution failed' 
            }
          }
        })
      )

      console.log("Resolved invites:", resolvedInvites)

      const resolutionErrors = resolvedInvites
        .filter(invite => invite.error)
        .map(invite => `${invite.identifier}: ${invite.error}`)

      const addressesToSend = resolvedInvites
        .filter((invite): invite is (typeof invite & { resolvedAddress: string }) => 
          invite.resolvedAddress !== null && invite.resolvedAddress !== undefined
        )
        .map((invite) => invite.resolvedAddress)

      console.log("Addresses to send:", addressesToSend)
      console.log("Resolution errors:", resolutionErrors)

      if (addressesToSend.length === 0) {
        throw new Error("No valid addresses to send invites to.\n" + resolutionErrors.join('\n'))
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = await provider.getSigner()
        
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
        const contract = new ethers.Contract(
          contractAddress,
          [
            'function mint(address account, uint256 tokenId, bytes data)'
          ],
          signer
        )

        // Process each address sequentially
        for (const address of addressesToSend) {
          const tx = await contract.mint(
            address,
            tokenId,
            "0x" // Empty bytes as data
          )
          await tx.wait()
        }

        alert(`Successfully invited ${addressesToSend.length} players to group ${tokenId}`)
        handleClose()

      } catch (error) {
        console.error("Error during mint:", error)
        throw new Error(`Mint failed: ${error instanceof Error ? error.message : String(error)}`)
      }

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