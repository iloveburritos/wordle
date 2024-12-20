// components/invite-modal.tsx

'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, Mail, Globe, Phone, Wallet, Share2, Plus, Copy, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resolveAddress } from "@/lib/utils"


interface IdentifierType {
  label: string
  value: 'email' | 'ens' | 'phone' | 'wallet'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const identifierTypes: IdentifierType[] = [
  { label: 'Email', value: 'email', icon: Mail },
  { label: 'ENS Domain', value: 'ens', icon: Globe },
  { label: 'Phone Number', value: 'phone', icon: Phone },
  { label: 'Wallet Address', value: 'wallet', icon: Wallet },
]

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [invites, setInvites] = useState([{ id: 1, identifier: '' }])
  const [errors, setErrors] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const resetForm = () => {
    setInvites([{ id: 1, identifier: '' }])
    setErrors({})
    setIsLoading(false)
    setInviteSent(false)
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

  const copyInviteMessage = (identifier: string) => {
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
    const message = `Join my private Wordle group by logging onto ${websiteUrl} using ${identifier.includes('@') ? identifier : identifier}`;
    navigator.clipboard.writeText(message);
  };

  async function handleSendInvites() {
    if (Object.values(errors).some(error => error) || invites.some(invite => !invite.identifier)) {
      alert("Please fill out all fields correctly before sending invites.")
      return
    }

    setIsLoading(true)

    try {
      const resolvedInvites = await Promise.all(
        invites.map(async (invite) => {
          try {
            const resolvedAddress = await resolveAddress(invite.identifier);
            return { ...invite, resolvedAddress, error: null };
          } catch (error) {
            return { ...invite, resolvedAddress: null, error: error instanceof Error ? error.message : 'Resolution failed' };
          }
        })
      );

      // Filter out invalid or unresolved addresses and collect errors
      const errors = resolvedInvites
        .filter(invite => invite.error)
        .map(invite => `${invite.identifier}: ${invite.error}`);

      const addressesToSend = resolvedInvites
        .filter((invite) => invite.resolvedAddress)
        .map((invite) => invite.resolvedAddress!);

      if (addressesToSend.length === 0) {
        throw new Error("No valid addresses to send invites to.\n" + errors.join('\n'));
      }

      // Call the minting API endpoint with increased gas price
      const response = await fetch("http://localhost:3001/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          walletAddresses: addressesToSend,
          // Add optional gas price multiplier if your backend supports it
          gasMultiplier: 1.2 // Increase gas price by 20%
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("NFTs minted successfully:", data.transactionHashes);
        alert("Invites sent and NFTs minted successfully!");
        setInviteSent(true);
      } else {
        console.error("Failed to mint NFTs:", data.error);
        if (data.error?.includes('replacement fee too low')) {
          alert("Transaction failed due to network congestion. Please try again with a higher gas price.");
        } else {
          alert(`Error: ${data.error || "Something went wrong."}`);
        }
      }
    } catch (error) {
      console.error("Error resolving addresses:", error)
      alert(error instanceof Error ? error.message : "An error occurred while resolving addresses. Please try again.")
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

        <div className="grid gap-4 py-4">
          {invites.map((invite, index) => (
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
                <Button 
                  onClick={() => copyInviteMessage(invite.identifier)} 
                  variant="ghost" 
                  className="flex-shrink-0"
                  aria-label="Copy invite message"
                  disabled={isLoading}
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Creating group...</p>
          </div>
        ) : inviteSent ? (
          <p className="text-center mt-4">
            Hit the copy button to share a personal invite link
          </p>
        ) : (
          <Button
            onClick={handleSendInvites}
            className="w-full mt-4"
            disabled={Object.values(errors).some(error => error) || invites.some(invite => !invite.identifier)}
          >
            <Share2 className="mr-2 h-4 w-4" /> Create a private group
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}