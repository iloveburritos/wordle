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
    try {
      const storedStats = sessionStorage.getItem('gameResults');
      if (storedStats) {
        const parsedData = JSON.parse(storedStats);
        
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
      }
    } catch (error) {
      console.error('Error parsing stats:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const resolveWalletDisplays = async () => {
      const uniqueWallets = new Set<string>();
      Object.values(groupedStats).forEach(stats => {
        stats.forEach(stat => uniqueWallets.add(stat.user));
      });

      try {
        // Fetch emails for all wallets
        const emailsResponse = await fetch('/api/walletsToEmails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddresses: Array.from(uniqueWallets) })
        });
        
        const { results } = await emailsResponse.json();
        
        // Create display format with email if available
        const displays: { [address: string]: string } = {};
        for (const wallet of uniqueWallets) {
          displays[wallet] = results[wallet] || 
            `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
        }
        
        setWalletDisplays(displays);
      } catch (error) {
        console.error('Error resolving wallet displays:', error);
        // Fallback to just wallet addresses
        const displays: { [address: string]: string } = {};
        uniqueWallets.forEach(wallet => {
          displays[wallet] = `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
        });
        setWalletDisplays(displays);
      }
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Game Results</h1>

        {Object.keys(groupedStats).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl mb-4">No scores available yet.</p>
            <Button onClick={handlePlayAgain}>Play a Game</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedStats).map(([tokenId, stats]) => (
              <div key={tokenId} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                <h2 className="text-lg font-semibold mb-3">Group {tokenId}</h2>
                <div className="space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="border-t border-gray-700 pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {walletDisplays[stat.user] || stat.user.slice(0, 6) + '...' + stat.user.slice(-4)}
                        </span>
                        {isCurrentUser(stat.user) && (
                          <span className="text-xs bg-green-600 px-2 py-0.5 rounded">You</span>
                        )}
                      </div>
                      <GameResultGrid board={parseGameBoard(stat.score)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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