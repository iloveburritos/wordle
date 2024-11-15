// app/page.tsx

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] min-h-[calc(100vh-88px)] p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">Welcome to on-chain Wordle!</h1>
        <p className="text-sm sm:text-base">
          An on-chain version of the popular NYT game, built with Next and for Ethereum. 
        </p>
        <Link href="/game">
          <div className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Play Game
          </div>
        </Link>


      </main>
    

    </div>
  );
}