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
  tokenId: string;
  encryptedScore: string;
  hashScore: string;
  user: string;
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

      // 1. Get current game ID from smart contract
      const provider = new ethers.providers.Web3Provider(await userWallet.getEthereumProvider());
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        "0x36a74dA23506e80Af8D85EfdE4A6eAB1C6cCc26c",
        ["function currentGame() view returns (uint256)"],
        signer
      );
      const currentGameId = await contract.currentGame();
      console.log("Current game ID:", currentGameId.toString());

      // 2. Get user's token IDs from newUser events
      const userTokenIds = await getWalletTokenIds(userWallet.address);
      if (!userTokenIds || userTokenIds.length === 0) {
        throw new Error("You need to be part of a group to view stats");
      }
      console.log("User token IDs:", userTokenIds);

      // 3. Fetch score submissions for the current game
      const query = `{
        scoreAddeds(
          where: {
            gameId: "${currentGameId.toString()}"
          }
        ) {
          id
          gameId
          user
          ciphertext
          datatoencrypthash
          blockTimestamp
          transactionHash
        }
      }`;

      const response = await fetch('https://api.studio.thegraph.com/query/94961/wordl31155/version/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();
      if (!data?.scoreAddeds) {
        throw new Error("No scores found for the current game");
      }

      console.log("Retrieved scores from subgraph:", data.scoreAddeds);

      // 4. Decrypt scores using Lit Protocol
      const decryptedResults = [];
      const totalScores = data.scoreAddeds.length;
      
      for (const [index, entry] of data.scoreAddeds.entries()) {
        try {
          setDecryptionProgress(Math.floor((index / totalScores) * 100));
          
          console.log(`Processing score ${index + 1}/${totalScores} for user ${entry.user}`);

          // Skip if missing encryption data
          if (!entry.ciphertext || !entry.datatoencrypthash) {
            console.warn(`Missing encryption data for user ${entry.user}`);
            continue;
          }

          // Decrypt the score
          const decryptedString = await decryptStringWithContractConditions(
            entry.ciphertext,
            entry.datatoencrypthash,
            signer,
            "baseSepolia"
          );

          if (!decryptedString) {
            console.warn(`Decryption failed for user ${entry.user}`);
            continue;
          }

          // Convert decrypted string to game board
          const gameBoard = stringToGameBoard(decryptedString);
          console.log(`Successfully decrypted score for user ${entry.user}:`, gameBoard);

          decryptedResults.push({
            tokenId: entry.gameId,
            score: gameBoard,
            user: entry.user,
            timestamp: parseInt(entry.blockTimestamp)
          });
        } catch (error) {
          console.error(`Error processing score for user ${entry.user}:`, error);
          continue;
        }
      }

      setDecryptionProgress(100);

      // 5. Handle results
      if (decryptedResults.length === 0) {
        throw new Error("Could not decrypt any scores");
      }

      // Sort by timestamp (most recent first)
      decryptedResults.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log("Final decrypted results:", decryptedResults);
      
      // 6. Navigate to results page
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