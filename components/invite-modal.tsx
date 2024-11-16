// components/invite-modal.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Mail, Globe, Phone, Wallet, Share2 } from 'lucide-react'
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
  const [value, setValue] = useState<IdentifierType['value'] | ''>('')
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')

  // Debugging: Log component mounts and data availability
  useEffect(() => {
    console.log('Component mounted with identifierTypes:', identifierTypes)
  }, [])

  const handleShare = () => {
    console.log(`Sharing invite for ${value}: ${identifier}`)
    onClose()
  }

  const validateIdentifier = (type: IdentifierType['value'], value: string) => {
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
    console.log('Validation error:', error)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black opacity-80">
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
                    ? identifierTypes.find((type) => type.value === value)?.label || "Select identifier type..."
                    : "Select identifier type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-black">
                <Command>
                  
                  <CommandEmpty>No identifier type found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {identifierTypes.map((type) => (
                        <CommandItem
                          key={type.value}
                          value={type.value}
                          onSelect={(currentValue) => {
                            const selectedValue = currentValue as IdentifierType['value'];
                            setValue(selectedValue === value ? '' : selectedValue);
                            setOpen(false);
                          }}
                           className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
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
                  </CommandList>
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
                if (value) {
                  validateIdentifier(value, e.target.value)
                }
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