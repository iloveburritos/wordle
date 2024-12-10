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

  return (
    <div className="grid grid-rows-6 gap-1 w-fit mx-auto">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-1">
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-8 h-8 flex items-center justify-center text-lg"
            >
              {getStateEmoji(cell.state)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 