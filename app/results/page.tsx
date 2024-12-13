'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWallets } from '@privy-io/react-auth';
import GameResultGrid from '@/components/GameResultGrid';
import { GameBoard, LetterState } from '@/lib/types';
import { formatWalletDisplay } from '@/lib/utils';

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
  const [walletDisplays, setWalletDisplays] = useState<{ [address: string]: string }>({});

  useEffect(() => {
    const statsParam = searchParams.get('stats');
    if (statsParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(statsParam));
        console.log("Parsed stats data:", parsedData);
        
        if (parsedData.groupedResults) {
          setGroupedStats(parsedData.groupedResults);
        } else if (parsedData.results && Array.isArray(parsedData.results)) {
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

  useEffect(() => {
    const resolveWalletDisplays = async () => {
      const displays: { [address: string]: string } = {};
      for (const [_, stats] of Object.entries(groupedStats)) {
        for (const stat of stats) {
          if (!displays[stat.user]) {
            displays[stat.user] = await formatWalletDisplay(stat.user);
          }
        }
      }
      setWalletDisplays(displays);
    };
    
    if (Object.keys(groupedStats).length > 0) {
      resolveWalletDisplays();
    }
  }, [groupedStats]);

  const handlePlayAgain = () => {
    router.push('/game');
  };

  const isCurrentUser = (address: string) => {
    return userWallet?.address?.toLowerCase() === address?.toLowerCase();
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
                        <span>Player: {walletDisplays[stat.user] || stat.user.slice(0, 6) + '...' + stat.user.slice(-4)}</span>
                        {isCurrentUser(stat.user) && (
                          <span className="text-xs bg-green-600 px-2 py-1 rounded">You</span>
                        )}
                      </h3>
                      <GameResultGrid board={parseGameBoard(stat.score)} />
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

// Helper function to parse the score string into a GameBoard
function parseGameBoard(scoreString: string): GameBoard {
  const stateMap: { [key: string]: LetterState } = {
    'G': LetterState.CORRECT,
    'Y': LetterState.PRESENT,
    'X': LetterState.ABSENT
  };

  const rows = scoreString.match(/.{1,5}/g) || [];
  return rows.map(row =>
    row.split('').map(char => ({
      letter: '',
      state: stateMap[char] || LetterState.INITIAL
    }))
  );
}