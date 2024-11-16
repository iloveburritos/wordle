'use client'

import React, { useState, useEffect } from 'react';
import { EncryptedGameResult, GameResult, icons, LetterState } from '../lib/types';

interface AIMChatProps {
  chatName: string;
  encryptedResult: EncryptedGameResult;
}

// Mock function to decrypt EncryptedGameResult
const mockDecrypt = (encrypted: EncryptedGameResult): GameResult => {
  const mockBoard = Array(6).fill(null).map(() => 
    Array(5).fill(null).map(() => ({
      letter: 'A',
      state: LetterState.CORRECT
    }))
  );
  return {
    board: mockBoard,
    encryptedString: encrypted,
    isSuccessful: true,
    score: 100
  };
};

const renderGrid = (board: GameResult['board']): string => {
  return board
    .map((row) => row.map((tile) => icons[tile.state]).join(''))
    .join('\n');
};

const AIMChat: React.FC<AIMChatProps> = ({ chatName, encryptedResult }) => {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    // In a real scenario, you'd use an actual decryption function here
    const decryptedResult = mockDecrypt(encryptedResult);
    setGameResult(decryptedResult);
  }, [encryptedResult]);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto border border-gray-300 rounded-md overflow-hidden">
      {/* Chat header */}
      <div className="bg-blue-600 text-white p-2 font-bold">
        {chatName}
      </div>

      {/* Chat messages */}
      <div className="flex-grow bg-white p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* System message */}
          <div className="text-gray-500 text-sm">
            <span className="font-bold">System: </span>
            <span>{new Date().toLocaleString()}</span>
            <p>Welcome to the chat! Here are your game results:</p>
          </div>

          {/* Game result message */}
          {gameResult && (
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-500 text-sm">
                <span className="font-bold">GameBot: </span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <pre className="mt-2 font-mono text-sm">
                {renderGrid(gameResult.board)}
              </pre>
              <p className="mt-2">
                Score: {gameResult.score}
                <br />
                Result: {gameResult.isSuccessful ? 'Success' : 'Failure'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat input (disabled) */}
      <div className="bg-gray-100 p-2">
        <input 
          type="text" 
          className="w-full p-2 rounded border border-gray-300 bg-gray-200" 
          placeholder="You can't type here..." 
          disabled 
        />
      </div>
    </div>
  );
};

export default AIMChat;