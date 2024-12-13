import React from 'react';
import { LetterState } from '../lib/types';

interface GameResultGridProps {
  result: string;
}

export default function GameResultGrid({ result }: GameResultGridProps) {
  const getStateClass = (state: string) => {
    switch (state) {
      case 'G':
        return 'wordle-tile-correct';
      case 'Y':
        return 'wordle-tile-present';
      case 'X':
        return 'wordle-tile-absent';
      default:
        return '';
    }
  };

  const rows = result.match(/.{1,5}/g) || [];

  return (
    <div className="wordle-grid">
      {rows.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.split('').map((state, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`wordle-tile ${getStateClass(state)}`}
            >
              {state}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

