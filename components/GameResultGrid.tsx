import React from 'react';
import { LetterState, GameBoard } from '@/lib/types';

interface GameResultGridProps {
  board: GameBoard;
}

const GameResultGrid: React.FC<GameResultGridProps> = ({ board }) => {
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateRows: `repeat(${board.length}, 1fr)` }}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-[2px]">
          {row.map((tile, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-5 h-5 flex items-center justify-center text-xs
                ${tile.state === LetterState.CORRECT ? 'bg-green-500' : ''}
                ${tile.state === LetterState.PRESENT ? 'bg-yellow-500' : ''}
                ${tile.state === LetterState.ABSENT ? 'bg-gray-500' : ''}
                ${tile.state === LetterState.INITIAL ? 'bg-gray-200' : ''}
              `}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameResultGrid; 