import { createContext, useContext, useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface GroupContextType {
  currentGroup: string | null
  setCurrentGroup: (groupId: string) => void
  isGroupMember: (address: string) => Promise<boolean>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<string | null>(null)
  const { user } = usePrivy()

  const isGroupMember = async (address: string) => {
    if (!currentGroup) return false
    
    try {
      const response = await fetch(`http://localhost:3001/check-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: currentGroup, address })
      })
      
      const data = await response.json()
      return data.isMember
    } catch (error) {
      console.error('Error checking membership:', error)
      return false
    }
  }

  return (
    <GroupContext.Provider value={{ currentGroup, setCurrentGroup, isGroupMember }}>
      {children}
    </GroupContext.Provider>
  )
}

export const useGroup = () => {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
} 