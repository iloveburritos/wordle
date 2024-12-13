// app/results/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWallets } from '@privy-io/react-auth';
import GameResultGrid from '@/components/GameResultGrid';
import { GameBoard, GameTile, LetterState } from '@/lib/types';
import { stringToGameBoard } from '@/lib/stringToGameBoard';

interface PlayerStat {
  tokenId: string;
  score: string;
  user: string;
  timestamp: number;
}

interface GroupedStats {
  [tokenId: string]: PlayerStat[];
}

interface Wallet {
  address: string;
}

export default function Results() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groupedStats, setGroupedStats] = useState<GroupedStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const { wallets } = useWallets();
  const userWallet = wallets[0] as Wallet | undefined;

  useEffect(() => {
    const statsParam = searchParams.get('stats');
    if (statsParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(statsParam));
        console.log("Parsed stats data:", parsedData);
        
        if (parsedData.groupedResults) {
          // Data is already grouped
          setGroupedStats(parsedData.groupedResults);
        } else if (parsedData.results && Array.isArray(parsedData.results)) {
          // If we have results array, group it
          const grouped = parsedData.results.reduce((acc: GroupedStats, stat: PlayerStat) => {
            if (!acc[stat.tokenId]) {
              acc[stat.tokenId] = [];
            }
            acc[stat.tokenId].push(stat);
            return acc;
          }, {} as GroupedStats);
          setGroupedStats(grouped);
        } else {
          console.error("Invalid data structure received:", parsedData);
          throw new Error("Invalid data structure");
        }
      } catch (error) {
        console.error('Error parsing stats:', error);
      }
    }
    setIsLoading(false);
  }, [searchParams]);

  const handlePlayAgain = () => {
    router.push('/game');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isCurrentUser = (address: string) => {
    return userWallet?.address?.toLowerCase() === address?.toLowerCase();
  };

  const renderGameTile = (tile: GameTile) => {
    const bgColorClass = 
      tile.state === LetterState.CORRECT ? 'bg-green-500' :
      tile.state === LetterState.PRESENT ? 'bg-yellow-500' :
      'bg-gray-500';

    return (
      <div
        className={`w-8 h-8 flex items-center justify-center font-bold text-white ${bgColorClass} rounded`}
      >
        {tile.letter}
      </div>
    );
  };

  const renderGameBoard = (scoreString: string) => {
    const gameBoard = stringToGameBoard(scoreString);
    
    return (
      <div className="grid gap-1">
        {gameBoard.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1">
            {row.map((tile, colIndex) => (
              <React.Fragment key={`${rowIndex}-${colIndex}`}>
                {renderGameTile(tile)}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Results...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Game Results</h1>

        {Object.keys(groupedStats).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl mb-4">No scores available yet.</p>
            <Button onClick={handlePlayAgain}>Play a Game</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedStats).map(([tokenId, stats]) => (
              <div key={tokenId} className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Group {tokenId}</h2>
                <div className="space-y-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="border-t border-gray-700 pt-4 first:border-0 first:pt-0">
                      <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                        <span>Player: {formatAddress(stat.user)}</span>
                        {isCurrentUser(stat.user) && (
                          <span className="text-xs bg-green-600 px-2 py-1 rounded">You</span>
                        )}
                      </h3>
                      {renderGameBoard(stat.score)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button 
            onClick={handlePlayAgain}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg"
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
