'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { EncryptedResult, GameBoard } from '@/lib/types';
import { useWallets } from '@privy-io/react-auth';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import { Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

interface SubmitScoreButtonProps {
  gameResult: {
    board: GameBoard;
    encryptedString: EncryptedResult;
    isSuccessful: boolean;
    score: number;
  };
  onSubmitStart: () => void;
  onSubmitComplete: () => void;
  onSubmitError: (error: string) => void;
  disabled: boolean;
}

export default function SubmitScoreButton({
  gameResult,
  onSubmitStart,
  onSubmitComplete,
  onSubmitError,
  disabled
}: SubmitScoreButtonProps) {
  const { wallets } = useWallets();
  const userWallet = wallets[0];
  const { tokenIds, loading: loadingTokens, error: tokenError } = useWalletTokens(userWallet?.address);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitScore = async () => {
    if (loadingTokens) {
      onSubmitError('Please wait while we verify your tokens...');
      return;
    }

    if (tokenError) {
      onSubmitError(`Error verifying tokens: ${tokenError.message}`);
      return;
    }

    if (tokenIds.length === 0) {
      onSubmitError('You need to have a token to submit a score. Please join or create a group first.');
      return;
    }

    setIsSubmitting(true);
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
        statement: 'Sign in with Ethereum to submit your score.',
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
        throw new Error(errorData.error || 'Failed to submit score');
      }

      onSubmitComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit score';
      if (errorMessage.includes('Score already submitted for this game')) {
        onSubmitComplete();
        return;
      }
      onSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      onClick={handleSubmitScore}
      disabled={disabled || isSubmitting}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSubmitting ? 'Decrypting group scores...' : 'Submit Score'}
    </Button>
  );
}