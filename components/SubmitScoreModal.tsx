'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EncryptedResult, GameBoard, GameResult } from '../lib/types';
import { SiweMessage } from 'siwe';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import GameResultGrid from './GameResultGrid';

interface SubmitScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScoreSubmitted: () => void;
  onSubmitStart: () => void;
  gameResult: {
    board: GameBoard;
    encryptedString: EncryptedResult;
    isSuccessful: boolean;
    score: number;
  };
  message: string;
  isSubmitting: boolean;
}

export default function SubmitScoreModal({ 
  isOpen, 
  onClose, 
  onScoreSubmitted, 
  onSubmitStart, 
  gameResult, 
  message, 
  isSubmitting 
}: SubmitScoreModalProps) {
  const { wallets } = useWallets();
  const userWallet = wallets[0];
  const { tokenIds, loading: loadingTokens, error: tokenError } = useWalletTokens(userWallet?.address);

  const handleSubmitScore = async () => {
    if (loadingTokens) {
      alert('Please wait while we verify your tokens...');
      return;
    }

    if (tokenError) {
      alert(`Error verifying tokens: ${tokenError.message}`);
      return;
    }

    if (tokenIds.length === 0) {
      alert('You need to have a token to submit a score. Please join or create a group first.');
      return;
    }

    onSubmitStart();
    try {
      const response = await fetch('http://localhost:3001/generate-nonce', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate nonce');
      }

      const { token } = await response.json();
      const { nonce } = JSON.parse(atob(token.split('.')[1]));

      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();
      const address = userWallet.address;

      const siweMessage = new SiweMessage({
        domain: typeof window !== 'undefined' ? window.location.host : '',
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: typeof window !== 'undefined' ? window.location.origin : '',
        version: '1',
        chainId: await signer.getChainId(),
        nonce,
      });

      const message = siweMessage.prepareMessage();
      const signature = await signer.signMessage(message);

      const apiResponse = await fetch('http://localhost:3001/send-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature,
          token,
          score: {
            ciphertext: gameResult.encryptedString.ciphertext,
            dataToEncryptHash: gameResult.encryptedString.dataToEncryptHash
          }
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        const errorMessage = errorData.error || 'Failed to send score';
        
        if (errorMessage.includes('Score already submitted for this game')) {
          console.log('Score was already submitted for this game, proceeding to stats');
          onScoreSubmitted();
          return;
        }
        throw new Error(errorMessage);
      }

      onScoreSubmitted();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit score. Please try again later.';
      
      if (errorMessage.includes('Score already submitted for this game')) {
        console.log('Score was already submitted for this game, proceeding to stats');
        onScoreSubmitted();
        return;
      }
      
      console.error('Error submitting score:', error);
      alert(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <GameResultGrid board={gameResult.board} />
        </div>
        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSubmitScore} 
            disabled={isSubmitting || loadingTokens}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : loadingTokens ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying tokens...
              </>
            ) : (
              'Submit Score'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}