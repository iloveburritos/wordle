'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, Mail, Globe, Phone, Wallet, Share2, Plus, Copy } from 'lucide-react'
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
  const [inviteSent, setInviteSent] = useState(false)

  const resetForm = () => {
    setInvites([{ id: 1, identifier: '' }])
    setErrors({})
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
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(identifier) && !identifier.endsWith('.eth')) {
      errorMessages[id] = 'Enter a valid wallet address or ENS domain'
    } else {
      errorMessages[id] = ''
    }

    setErrors(errorMessages)
  }

  const copyInviteMessage = (identifier: string) => {
    const message = `Join my private Wordle group. You can login to ${process.env.NEXT_PUBLIC_WEBSITE_URL} using your (${identifier})`
    navigator.clipboard.writeText(message)
  }

  async function handleSendInvites() {
    if (Object.values(errors).some((error) => error) || invites.some((invite) => !invite.identifier)) {
      alert("Please fill out all fields correctly before sending invites.");
      return;
    }
  
    try {
      // Resolve identifiers to wallet addresses
      const resolvedInvites = await Promise.all(
        invites.map(async (invite) => {
          const resolvedAddress = await resolveAddress(invite.identifier);
          return { ...invite, resolvedAddress };
        })
      );
  
      // Filter out invalid or unresolved addresses
      const addressesToSend = resolvedInvites
        .filter((invite) => invite.resolvedAddress)
        .map((invite) => invite.resolvedAddress);
  
      if (addressesToSend.length === 0) {
        throw new Error("No valid addresses to send invites to.");
      }
  
      console.log("Resolved Addresses:", addressesToSend);
  
      // Call the minting API endpoint on the Express server
      const response = await fetch("http://localhost:3001/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddresses: addressesToSend }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("NFTs minted successfully:", data.transactionHashes);
        alert("Invites sent and NFTs minted successfully!");
        setInviteSent(true);
      } else {
        console.error("Failed to mint NFTs:", data.error);
        alert(`Error: ${data.error || "Something went wrong."}`);
      }
    } catch (error) {
      console.error("Error resolving addresses or sending invites:", error);
      alert("An unexpected error occurred. Please try again later.");
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
            <div key={invite.id} className="flex items-center gap-4">
              <Input
                placeholder="Wallet / ENS"
                value={invite.identifier}
                onChange={(e) => handleIdentifierChange(invite.id, e.target.value)}
                className="flex-grow"
              />
              <Button onClick={() => copyInviteMessage(invite.identifier)} variant="ghost" className="flex-shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
              {errors[invite.id] && (
                <p className="text-sm text-red-500 w-full">{errors[invite.id]}</p>
              )}
            </div>
          ))}

          <Button
            onClick={addInviteField}
            variant="outline"
            className="w-full mt-2 border-none"
            disabled={!invites[invites.length - 1].identifier || !!errors[invites.length - 1]}
          >
            <Plus className="mr-2 h-4 w-4" /> Invite another player
          </Button>
        </div>

        {inviteSent ? (
          <p className="text-center mt-4">
            Hit the copy button to share a personal invite link
          </p>
        ) : (
          <Button
            onClick={handleSendInvites}
            className="w-full mt-4"
            disabled={Object.values(errors).some(error => error) || invites.some(invite => !invite.identifier)}
          >
            <Share2 className="mr-2 h-4 w-4" /> Send Invites
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}