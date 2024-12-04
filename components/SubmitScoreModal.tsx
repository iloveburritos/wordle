'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EncryptedResult, GameBoard, GameResult, icons, LetterState } from '../lib/types';
import { SiweMessage } from 'siwe';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

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

const renderGrid = (board: GameResult['board']): string => {
  const lastCompletedRowIndex = board.findIndex(row => row.some(tile => tile.state === LetterState.INITIAL));
  const completedRows = lastCompletedRowIndex === -1 ? board : board.slice(0, lastCompletedRowIndex);
  return completedRows
    .map((row) => row.map((tile) => icons[tile.state]).join(''))
    .join('\n');
};

export default function SubmitScoreModal({ isOpen, onClose, onScoreSubmitted, onSubmitStart, gameResult, message, isSubmitting }: SubmitScoreModalProps) {
  const { wallets } = useWallets();
  const userWallet = wallets[0];
  const grid = renderGrid(gameResult.board);

  const handleSubmitScore = async () => {
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
          score: gameResult.encryptedString,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to send score');
      }

      onScoreSubmitted();
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again later.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <pre>{grid}</pre>
        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSubmitScore} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
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