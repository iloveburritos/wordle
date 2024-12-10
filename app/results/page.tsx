// app/results/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import GameResultGrid from '@/components/GameResultGrid';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { decryptStringWithContractConditions } from '@/lib/litUtils';
import { fetchScoresForCurrentGame } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PlayerStat {
  tokenId: string;
  score: string;
  user: string;
}

export default function Results() {
  const router = useRouter();
  const { wallets } = useWallets();
  const userWallet = wallets[0];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (!userWallet) {
        throw new Error("Please connect your wallet first");
      }

      const stats = await fetchScoresForCurrentGame();
      if (!stats.data?.scoreAddeds) {
        console.log('No scores found for current game');
        setPlayerStats([]);
        setIsLoading(false);
        return;
      }

      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();

      const results: PlayerStat[] = [];
      for (const entry of stats.data.scoreAddeds) {
        const { tokenId, encryptedScore, hashScore, user } = entry;
        try {
          let retryCount = 0;
          let score;
          while (retryCount < 3) {
            try {
              score = await decryptStringWithContractConditions(
                encryptedScore,
                hashScore,
                signer,
                "baseSepolia"
              );
              break;
            } catch (decryptError) {
              retryCount++;
              if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                continue;
              }
              throw decryptError;
            }
          }
          results.push({ 
            tokenId: tokenId.toString(), 
            score: score || 'Decryption failed', 
            user 
          });
        } catch (error) {
          console.error(`Decryption error for tokenId ${tokenId}:`, error);
          results.push({ 
            tokenId: tokenId.toString(), 
            score: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            user 
          });
        }
      }

      setPlayerStats(results);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading game results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Game Results</h1>
        <p className="text-gray-400 text-center mb-8">Here are the scores from the current game:</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!error && playerStats.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-xl text-gray-400">No scores found for the current game.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Player</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Token ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((stat, index) => (
                    <tr key={index} className="border-b border-gray-700 last:border-0">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{stat.user}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {stat.tokenId === '0' ? 'No Token Connected' : stat.tokenId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {stat.score === null ? (
                          <span className="text-gray-500">Score Not Set</span>
                        ) : stat.score === '' ? (
                          <span className="text-gray-500">Empty Score</span>
                        ) : stat.score.startsWith('Failed') ? (
                          <span className="text-red-500">{stat.score}</span>
                        ) : (
                          <div className="flex justify-start">
                            <GameResultGrid 
                              encryptedScore={stat.score} 
                              hashScore="" 
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="inline-block bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Score Legend</h2>
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>

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
