//components/Header.tsx

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WalletButton } from './WalletModal' 

export default function Header() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 py-4 bg-black bg-opacity-40 backdrop-blur-lg">
          <div className="flex items-center space-x-4">
            <WalletButton />
          </div>
    </header>
  )
}