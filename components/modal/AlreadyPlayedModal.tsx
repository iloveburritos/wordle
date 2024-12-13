import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallets } from '@privy-io/react-auth';
import { getContract } from '@/lib/provider';

interface AlreadyPlayedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlreadyPlayedModal({ isOpen, onClose }: AlreadyPlayedModalProps) {
  const router = useRouter();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeeResults = async () => {
    setIsLoading(true);
    try {
      if (!wallets?.[0]) {
        throw new Error("Please connect your wallet first");
      }

      // Get current game ID
      const contract = getContract();
      const currentGameId = await contract.currentGame();
      
      // Navigate to results page
      router.push(`/results?gameId=${currentGameId.toString()}`);
    } catch (error) {
      console.error('Error navigating to results:', error);
      alert('Failed to load results. Please try again.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Already Played Today</DialogTitle>
          <DialogDescription>
            You've already played today's game. Come back tomorrow for a new challenge!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSeeResults} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'See Results'}
          </Button>
          <Button 
            onClick={onClose}
            variant="ghost"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 