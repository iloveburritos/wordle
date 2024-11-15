//components/Header.tsx

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WalletButton } from './WalletModal' 

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 bg-black bg-opacity-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <Link href="/" className="flex items-center w-full md:w-auto justify-center md:justify-start mb-4 md:mb-0">
          <Image
            src="/images/SC_logo.png"
            alt="Stoner Cats Logo"
            width={250}
            height={75}
            className="h-auto"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="
          />
        </Link>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex items-center space-x-4">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
} 