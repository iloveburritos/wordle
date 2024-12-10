// components/StatsModal.tsx

'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { fetchScoresForCurrentGame, getWalletTokenIds } from '../lib/utils';
import { decryptStringWithContractConditions } from '@/lib/litUtils';
import { Loader2 } from 'lucide-react';
import { GameBoard, LetterState } from '@/lib/types';
import { decryptGameResult } from '@/lib/decryptGameResult';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DecryptedResult {
  tokenId: string;
  score: GameBoard;
  user: string;
  timestamp: number;
}

interface ScoreAdded {
  gameId: string;
  user: string;
  ciphertext: string;
  datatoencrypthash: string;
  blockTimestamp: string;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const { wallets } = useWallets();
  const userWallet = wallets[0];

  const handleSeeStats = async () => {
    setIsLoading(true);
    setIsProcessing(true);
    setDecryptionProgress(0);
    
    try {
      if (!userWallet) {
        throw new Error("Please connect your wallet first");
      }

      // Get user's token IDs
      const userTokenIds = await getWalletTokenIds(userWallet.address);
      if (!userTokenIds || userTokenIds.length === 0) {
        throw new Error("You need to be part of a group to view stats");
      }

      // Fetch current game scores
      const stats = await fetchScoresForCurrentGame();
      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();

      const decryptedResults: DecryptedResult[] = [];
      
      // Filter scores for user's groups and current game
      const relevantScores = stats.data?.scoreAddeds?.filter(
        (score: ScoreAdded) => userTokenIds.includes(Number(score.gameId))
      ) || [];

      console.log('Relevant scores:', relevantScores);

      let processedCount = 0;
      for (const entry of relevantScores) {
        const { gameId, ciphertext, datatoencrypthash, user, blockTimestamp } = entry;
        try {
          let retryCount = 0;
          let decryptedString: string | undefined;
          
          while (retryCount < 3) {
            try {
              decryptedString = await decryptStringWithContractConditions(
                ciphertext,
                datatoencrypthash,
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

          if (!decryptedString) {
            throw new Error('Failed to decrypt score');
          }

          // Convert the decrypted string to a game board
          const gameBoard = decryptGameResult({ 
            ciphertext: decryptedString, 
            dataToEncryptHash: datatoencrypthash 
          });

          decryptedResults.push({ 
            tokenId: gameId, 
            score: gameBoard, 
            user,
            timestamp: parseInt(blockTimestamp)
          });

          processedCount++;
          setDecryptionProgress(Math.floor((processedCount / relevantScores.length) * 100));
        } catch (error) {
          console.error(`Decryption error for gameId ${gameId}:`, error);
          processedCount++;
          setDecryptionProgress(Math.floor((processedCount / relevantScores.length) * 100));
          continue;
        }
      }

      // If no scores found but user has tokens, create an empty result set for their groups
      if (decryptedResults.length === 0) {
        userTokenIds.forEach((tokenId: number) => {
          decryptedResults.push({
            tokenId: tokenId.toString(),
            score: Array(6).fill(null).map(() => 
              Array(5).fill(null).map(() => ({ letter: '', state: LetterState.INITIAL }))
            ),
            user: userWallet.address,
            timestamp: Date.now()
          });
        });
      }

      // Sort results by group and timestamp
      decryptedResults.sort((a, b) => {
        if (a.tokenId === b.tokenId) {
          return b.timestamp - a.timestamp; // Most recent first within same group
        }
        return Number(a.tokenId) - Number(b.tokenId); // Group order
      });

      const queryString = encodeURIComponent(JSON.stringify(decryptedResults));
      router.push(`/results?stats=${queryString}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error in handleSeeStats:', error);
      alert(`Failed to fetch stats: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      setDecryptionProgress(0);
      onClose();
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>View Current Game Stats</DialogTitle>
          <DialogDescription>
            {isProcessing 
              ? `Decrypting group scores... ${decryptionProgress}% complete`
              : "Ready to see how your groups performed in the current game?"
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSeeStats} 
            variant="outline"
            disabled={isLoading || isProcessing}
          >
            {isLoading || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessing ? 'Decrypting Scores...' : 'Loading...'}
              </>
            ) : (
              'See Group Stats'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 