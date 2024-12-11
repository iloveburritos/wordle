import React from 'react';
import { LetterState } from '../lib/types';

interface GameResultGridProps {
  board: {
    letter: string;
    state: LetterState;
  }[][];
}

export default function GameResultGrid({ board }: GameResultGridProps) {
  const getStateEmoji = (state: LetterState) => {
    switch (state) {
      case LetterState.CORRECT:
        return '🟩';
      case LetterState.PRESENT:
        return '🟨';
      case LetterState.ABSENT:
        return '⬛';
      default:
        return '⬜';
    }
  };

  // Filter out empty rows (rows where all states are INITIAL)
  const completedRows = board.filter(row => 
    row.some(cell => cell.state !== LetterState.INITIAL)
  );

  return (
    <div className="flex flex-col">
      {completedRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="text-lg leading-none"
            >
              {getStateEmoji(cell.state)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 