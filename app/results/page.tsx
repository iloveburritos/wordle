// app/results/page.tsx

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

interface PlayerStat {
  tokenId: string;
  score: string | null;
  user: string;
}

export default function Results() {
  const searchParams = useSearchParams();
  const statsParam = searchParams.get('stats');
  const playerStats: PlayerStat[] = statsParam ? JSON.parse(decodeURIComponent(statsParam)) : [];

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Game Results</h1>
      <p>Here are your game statistics and achievements:</p>

      <table style={{ margin: '20px auto', borderCollapse: 'collapse', width: '80%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>Player</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Token ID</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {playerStats.map((stat, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{stat.user}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>
                {stat.tokenId === '0' ? 'No Token Connected' : stat.tokenId}
              </td>
              <td style={{ border: '1px solid black', padding: '8px' }}>
                {stat.score === null ? 'Score Not Set' : 
                 stat.score === '' ? 'Empty Score' : 
                 stat.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: '40px' }}>Thank you for playing!</p>
    </div>
  );
}
