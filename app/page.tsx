// app/page.tsx

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold">Welcome to VVordle!</h1>
        <p className="text-sm sm:text-base">
          A Wordle clone built with Next.js and React. Test your word-guessing skills by playing our game.
        </p>
        <Link href="/game">
          <div className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Play Game
            </div>

        </Link>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-6">
          <a
            href="https://github.com/yyx990803/vue-wordle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Source Code on GitHub
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Next.js Documentation
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn Next.js
        </a>
        <a
          href="https://vercel.com/templates"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Explore Templates
        </a>
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Next.js Official Site →
        </a>
      </footer>
    </div>
  );
}