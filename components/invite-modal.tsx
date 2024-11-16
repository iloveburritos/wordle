'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, Mail, Globe, Phone, Wallet, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const identifierTypes = [
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
  const [value, setValue] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')

  const handleShare = () => {
    // Implement share functionality here
    console.log(`Sharing invite for ${value}: ${identifier}`)
    // For now, we'll just close the modal
    onClose()
  }

  const validateIdentifier = (type: string, value: string) => {
    setError('')
    switch (type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setError('Invalid email address')
        }
        break
      case 'ens':
        if (!value.endsWith('.eth')) {
          setError('Invalid ENS domain')
        }
        break
      case 'phone':
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
          setError('Invalid phone number')
        }
        break
      case 'wallet':
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          setError('Invalid wallet address')
        }
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Play</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="identifier-type" className="text-right">
              Type
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="col-span-3 justify-between"
                >
                  {value
                    ? identifierTypes.find((type) => type.value === value)?.label
                    : "Select identifier type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search identifier type..." />
                  <CommandEmpty>No identifier type found.</CommandEmpty>
                  <CommandGroup>
                    {identifierTypes.map((type) => (
                      <CommandItem
                        key={type.value}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? "" : currentValue)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === type.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {React.createElement(type.icon, { className: "mr-2 h-4 w-4" })}
                        {type.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="identifier" className="text-right">
              Identifier
            </Label>
            <Input
              id="identifier"
              className="col-span-3"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                validateIdentifier(value, e.target.value)
              }}
              placeholder={`Enter ${value || 'identifier'}...`}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <Button onClick={handleShare} className="w-full" disabled={!value || !identifier || !!error}>
          <Share2 className="mr-2 h-4 w-4" /> Share Invite
        </Button>
      </DialogContent>
    </Dialog>
  )
}