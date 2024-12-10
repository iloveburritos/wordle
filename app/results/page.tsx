// app/results/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GameResultGrid from '@/components/GameResultGrid';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { GameBoard } from '@/lib/types';
import { useWallets } from '@privy-io/react-auth';

interface PlayerStat {
  tokenId: string;
  score: GameBoard;
  user: string;
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
        const decodedStats = JSON.parse(decodeURIComponent(statsParam)) as PlayerStat[];
        
        // Group stats by tokenId
        const grouped = decodedStats.reduce((acc: GroupedStats, stat) => {
          if (!acc[stat.tokenId]) {
            acc[stat.tokenId] = [];
          }
          acc[stat.tokenId].push(stat);
          return acc;
        }, {});

        setGroupedStats(grouped);
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
                      <GameResultGrid board={stat.score} />
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
