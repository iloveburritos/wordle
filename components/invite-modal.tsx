'use client'

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Mail, Globe, Phone, Wallet, Share2, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [open, setOpen] = useState(false)
  const [invites, setInvites] = useState([{ id: 1, identifier: '' }])
  const [errors, setErrors] = useState<{ [key: number]: string }>({})

  const resetForm = () => {
    setInvites([{ id: 1, identifier: '' }])
    setErrors({})
  }

  const addInviteField = () => {
    // Add only if the last row is valid
    if (invites[invites.length - 1].identifier && !errors[invites.length - 1]) {
      setInvites([...invites, { id: invites.length + 1, identifier: '' }])
    }
  }

  const handleIdentifierChange = (id: number, identifier: string) => {
    const updatedInvites = invites.map(invite =>
      invite.id === id ? { ...invite, identifier } : invite
    )
    setInvites(updatedInvites)
    validateIdentifier(identifier, id)
  }

  const validateIdentifier = (value: string, id: number) => {
    const errorMessages = { ...errors }
    if (!/^0x[a-fA-F0-9]{40}$/.test(value) && !value.endsWith('.eth')) {
      errorMessages[id] = 'Enter a valid wallet address or ENS domain'
    } else {
      errorMessages[id] = ''
    }
    setErrors(errorMessages)
  }

  const handleSendInvites = () => {
    console.log(invites)  // Placeholder for invite processing logic
    resetForm()
    onClose()  // Close the modal after sending invites
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] bg-black bg-opacity-80">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Invite to Play</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {invites.map((invite, index) => (
            <div key={invite.id} className="flex items-center gap-4">
              <Label
                htmlFor={`identifier-${invite.id}`}
                className="text-right w-24 md:w-32 flex-shrink-0"
              >
                Wallet / ENS
              </Label>
              <Input
                id={`identifier-${invite.id}`}
                className="flex-grow"
                value={invite.identifier}
                onChange={(e) => handleIdentifierChange(invite.id, e.target.value)}
                placeholder="Enter wallet address or ENS domain..."
              />
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
            <Plus className="mr-2 h-4 w-4" /> Add Another Invite
          </Button>
        </div>

        <Button
          onClick={handleSendInvites}
          className="w-full mt-4"
        >
          <Share2 className="mr-2 h-4 w-4" /> Send Invites
        </Button>
      </DialogContent>
    </Dialog>
  )
}