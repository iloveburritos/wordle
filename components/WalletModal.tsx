// components/WalletModal.tsx

"use client"

import React, { useState, useRef, useEffect } from 'react'

// Define the disconnectWeb3 function
const disconnectWeb3 = async () => {
  // Add your logic to disconnect the Web3 wallet session here
}
import { usePrivy } from '@privy-io/react-auth'
import { LogOut, X } from 'lucide-react'

interface WalletButtonProps {
  className?: string
}

export const WalletButton: React.FC<WalletButtonProps> = ({ className }) => {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userWalletAddress = user?.wallet?.address || user?.email?.address || ''
  const formattedAddress = userWalletAddress
    ? `${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`
    : ''

  const disableButton = !ready

  const handleClick = () => {
    if (authenticated) {
      setIsDropdownOpen(!isDropdownOpen)
    } else {
      login()
    }
  }

  const handleDisconnect = async () => {
    try {
      // Disconnect Web3 wallet session
      await disconnectWeb3()

      // Fully log out from Privy
      await logout()

      // Reset dropdown state after logout
      setIsDropdownOpen(false)

      // Optionally, clear other wallet-related states here if necessary
    } catch (error) {
      console.error("Error during disconnect:", error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        className="button rounded"
        disabled={disableButton}
        onClick={handleClick}
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        {authenticated ? "Logged In" : "Connect Wallet"}
      </button>

      {authenticated && isDropdownOpen && (
        <div
          className="absolute left-0 right-0 mt-2 md:left-auto md:right-0 min-w-max rounded-md shadow-lg bg-popover text-popover-foreground border border-border"
          style={{ background: 'black' }}
        >
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <p className="px-4 py-2 text-sm">{formattedAddress}</p>
            <button
              onClick={handleDisconnect}
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
              role="menuitem"
            >
              <LogOut className="mr-2 h-4 w-4 flex-shrink-0" /> Disconnect
            </button>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
              role="menuitem"
            >
              <X className="mr-2 h-4 w-4 flex-shrink-0" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}