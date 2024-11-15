// app/page.tsx

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] min-h-[calc(100vh-88px)] p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">Welcome to on-chain Wordle!</h1>
        <p className="text-sm sm:text-base">
          An on-chain version of the popular NYT game, built with Next and for Ethereum. 
        </p>
        <Link href="/game">
          <Button size="lg">
            Play Game
          </Button>
        </Link>
      </main>
    </div>
  );
}