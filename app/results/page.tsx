// app/results/page.tsx

'use client';

import React from 'react';
import AIMChat from '@/components/AIMChat';
import { EncryptedGameResult } from '@/lib/types';


export default function Results() {
    const encryptedResult: EncryptedGameResult = "your-encrypted-result-string-here";
    
  return (
    
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Game Results</h1>
      <p>Here are your game statistics and achievements:</p>
      <div className="container mx-auto p-4">
      <AIMChat chatName="Wordle Results" encryptedResult={encryptedResult} />
    </div>

      {/* Placeholder for results; update with real data as needed */}
      <div style={{ marginTop: '20px', fontSize: '18px' }}>
        <p>Total Games Played: 10</p>
        <p>Total Wins: 6</p>
        <p>Best Score: 3</p>
        <p>Average Score: 4</p>
      </div>

      <p style={{ marginTop: '40px' }}>Thank you for playing!</p>
    </div>
  );
}