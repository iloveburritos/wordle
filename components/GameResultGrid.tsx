import React from 'react';
import { LetterState } from '@/lib/types';

interface GameResultGridProps {
  encryptedScore: string;
  hashScore: string;
}

const GameResultGrid: React.FC<GameResultGridProps> = ({ encryptedScore }) => {
  const rows = encryptedScore.match(/.{1,5}/g) || [];
  
  const letterStateMap: { [key: string]: LetterState } = {
    'G': LetterState.CORRECT,
    'Y': LetterState.PRESENT,
    'X': LetterState.ABSENT
  };

  return (
    <div className="grid gap-[2px]" style={{ gridTemplateRows: `repeat(${rows.length}, 1fr)` }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-[2px]">
          {row.split('').map((char, colIndex) => {
            const state = letterStateMap[char] || LetterState.INITIAL;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-5 h-5 flex items-center justify-center text-xs
                  ${state === LetterState.CORRECT ? 'bg-green-500' : ''}
                  ${state === LetterState.PRESENT ? 'bg-yellow-500' : ''}
                  ${state === LetterState.ABSENT ? 'bg-gray-500' : ''}
                  ${state === LetterState.INITIAL ? 'bg-gray-200' : ''}
                `}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameResultGrid; 