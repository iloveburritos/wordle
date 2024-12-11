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
import { stringToGameBoard } from '@/lib/stringToGameBoard';

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

      console.log('User token IDs:', userTokenIds);

      // Fetch current game scores
      const stats = await fetchScoresForCurrentGame();
      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();

      if (!stats.data?.scoreAddeds) {
        throw new Error("No scores found for the current game");
      }

      console.log('All scores:', stats.data.scoreAddeds);

      const decryptedResults: DecryptedResult[] = [];
      
      // Get all scores for the current game
      const relevantScores = stats.data.scoreAddeds;
      console.log('Relevant scores:', relevantScores);

      let processedCount = 0;
      for (const entry of relevantScores) {
        const { gameId, ciphertext, datatoencrypthash, user, blockTimestamp } = entry;
        try {
          console.log(`Attempting to decrypt score for user ${user}`);
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
              console.log('Raw decrypted string:', decryptedString);
              break;
            } catch (decryptError) {
              console.error(`Decryption attempt ${retryCount + 1} failed:`, decryptError);
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

          // The decryptedString is already in the format 'G', 'Y', 'X'
          // We just need to convert it directly to a game board
          const gameBoard = stringToGameBoard(decryptedString);

          console.log('Converted game board:', gameBoard);

          decryptedResults.push({ 
            tokenId: gameId, 
            score: gameBoard, 
            user,
            timestamp: parseInt(blockTimestamp)
          });

          processedCount++;
          setDecryptionProgress(Math.floor((processedCount / relevantScores.length) * 100));
        } catch (error) {
          console.error(`Decryption error for user ${user}:`, error);
          processedCount++;
          setDecryptionProgress(Math.floor((processedCount / relevantScores.length) * 100));
          continue;
        }
      }

      console.log('Final decrypted results:', decryptedResults);

      // Sort results by timestamp
      decryptedResults.sort((a, b) => b.timestamp - a.timestamp); // Most recent first

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