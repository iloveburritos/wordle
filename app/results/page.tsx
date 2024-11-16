// app/results/page.tsx

'use client';

import React from 'react';
import AIMChat from '@/components/AIMChat';
import StatsDisplay from '@/components/StatsDisplay';
import { EncryptedGameResult } from '@/lib/types';

export default function Results() {
  const encryptedResult: EncryptedGameResult = "your-encrypted-result-string-here";

  // Example array of player stats
  const playerStats = [
    { player: 'alice.eth', totalGames: 15, totalWins: 10, bestScore: 2, averageScore: 3 },
    { player: '0x123...abcd', totalGames: 12, totalWins: 8, bestScore: 3, averageScore: 4 },
    { player: 'bob.eth', totalGames: 18, totalWins: 12, bestScore: 1, averageScore: 2 },
  ];

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Game Results</h1>
      <p>Here are your game statistics and achievements:</p>
      
      <div className="container mx-auto p-4">
        <AIMChat chatName="Wordle Results" encryptedResult={encryptedResult} />
      </div>

      {/* Use StatsDisplay with dynamic player data */}
      <StatsDisplay playerStats={playerStats} />

      <p style={{ marginTop: '40px' }}>Thank you for playing!</p>
    </div>
  );
}