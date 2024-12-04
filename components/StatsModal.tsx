'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { fetchScoresForCurrentGame } from '../lib/utils';
import { decryptStringWithContractConditions } from '@/lib/litUtils';
import { Loader2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { wallets } = useWallets();
  const userWallet = wallets[0];

  const handleSeeStats = async () => {
    setIsLoading(true);
    setIsProcessing(true);
    try {
      if (!userWallet) {
        throw new Error("Please connect your wallet first");
      }

      const stats = await fetchScoresForCurrentGame();
      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();

      const decryptedResults = [];
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
          decryptedResults.push({ tokenId, score: score || 'Decryption failed', user });
        } catch (error) {
          console.error(`Decryption error for tokenId ${tokenId}:`, error);
          decryptedResults.push({ 
            tokenId, 
            score: `Failed: ${error.message || 'Unknown error'}`, 
            user 
          });
        }
      }

      const queryString = encodeURIComponent(JSON.stringify(decryptedResults));
      await router.push(`/results?stats=${queryString}`);
    } catch (error) {
      console.error('Error in handleSeeStats:', error);
      alert(`Failed to fetch stats: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
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
          <DialogTitle>View Game Stats</DialogTitle>
          <DialogDescription>
            {isProcessing 
              ? "Decrypting scores... Please sign the message when prompted."
              : "Ready to see how you compare?"
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
                {isProcessing ? 'Decrypting...' : 'Loading...'}
              </>
            ) : (
              'See Stats'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 