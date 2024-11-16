'use client';

import React, { useState, useEffect } from 'react';
import { EncryptedGameResult, GameResult, icons, LetterState } from '../lib/types';
import { decryptGameResult } from '../lib/decryptGameResult';

interface AIMChatProps {
  chatName: string;
  encryptedResult: EncryptedGameResult;
}

const renderGrid = (board: GameResult['board']): string => {
  return board
    .map((row) => row.map((tile) => icons[tile.state]).join(''))
    .join('\n');
};

const AIMChat: React.FC<AIMChatProps> = ({ chatName, encryptedResult }) => {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark the component as mounted so that it only renders on the client
    setMounted(true);

    // Set the current date in GMT format
    const date = new Date();
    const gmtDate = date.toISOString().replace('T', ' ').split('.')[0] + ' GMT';
    setCurrentDate(gmtDate);

    // Decrypt the result using the decryptGameResult function
    const decryptedBoard = decryptGameResult(encryptedResult);
    console.log("Decrypted GameResult in AIMChat:", decryptedBoard); // Debugging log

    // Construct the GameResult object based on the decrypted board
    const decryptedResult: GameResult = {
      board: decryptedBoard,
      encryptedString: encryptedResult,
      isSuccessful: decryptedBoard.some(row => row.every(tile => tile.state === LetterState.CORRECT)),
      score: decryptedBoard.filter(row => row.some(tile => tile.state !== LetterState.INITIAL)).length
    };

    setGameResult(decryptedResult);
  }, [encryptedResult]);

  if (!mounted) {
    return null; // Return null on the initial server render to avoid mismatch
  }

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
            <span>{currentDate}</span>
            <p>Welcome to the chat! Here are your game results:</p>
          </div>

          {/* Game result message */}
          {gameResult && (
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-500 text-sm">
                <span className="font-bold">GameBot: </span>
                <span>{currentDate}</span>
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
    </div>
  );
};

export default AIMChat;