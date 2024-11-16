// components/StatsDisplay.tsx

import React from 'react';

interface PlayerStats {
  player: string; // ENS name or wallet address
  totalGames: number;
  totalWins: number;
  bestScore: number;
  averageScore: number;
}

interface StatsDisplayProps {
  playerStats: PlayerStats[];
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ playerStats }) => {
  return (
    <div className="stats-grid" style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
      {/* Grid header */}
      <div style={{ display: 'contents', fontWeight: 'bold', fontSize: '18px' }}>
        <div>Player</div>
        <div>Total Games</div>
        <div>Total Wins</div>
        <div>Best Score</div>
        <div>Average Score</div>
      </div>

      {/* Grid rows */}
      {playerStats.map((stats, index) => (
        <div key={index} style={{ display: 'contents', fontSize: '16px', padding: '8px 0' }}>
          <div>{stats.player}</div>
          <div>{stats.totalGames}</div>
          <div>{stats.totalWins}</div>
          <div>{stats.bestScore}</div>
          <div>{stats.averageScore}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsDisplay;