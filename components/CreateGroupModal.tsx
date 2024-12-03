'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePrivy } from '@privy-io/react-auth'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = usePrivy()

  const handleCreateGroup = async () => {
    if (!groupName || !user?.wallet?.address) return
    
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          walletAddress: user.wallet.address,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Group</h2>
        <Input
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
} 