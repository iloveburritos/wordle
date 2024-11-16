// app/results/page.tsx

'use client';

import React from 'react';

export default function Results() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Game Results</h1>
      <p>Here are your game statistics and achievements:</p>

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