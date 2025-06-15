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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const BASE_SEPOLIA_CHAIN_ID = '0x14A34'; // 84532 in hex

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

    if (!apiUrl) {
      onSubmitError('API URL not configured. Please check your environment variables.');
      return;
    }

    setIsSubmitting(true);
    onSubmitStart();

    try {
      // Ensure wallet is on Base Sepolia before proceeding
      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(userSigner);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 84532) {
        try {
          await userSigner.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          console.error('Failed to switch to Base Sepolia:', switchError);
          onSubmitError('Failed to switch to Base Sepolia network. Please approve the network switch in your wallet.');
          setIsSubmitting(false);
          return;
        }
      }
      // Re-instantiate provider and signer after switching
      const switchedProvider = new ethers.BrowserProvider(userSigner);
      const signer = await switchedProvider.getSigner();
      const address = userWallet.address;

      console.log('Attempting to connect to API at:', `${apiUrl}/generate-nonce`);
      
      const response = await fetch(`${apiUrl}/generate-nonce`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to generate nonce: ${response.status} ${errorText}`);
      }

      const { token } = await response.json();
      const { nonce } = JSON.parse(atob(token.split('.')[1]));

      const siweMessage = new SiweMessage({
        domain: typeof window !== 'undefined' ? window.location.host : '',
        address,
        statement: 'Sign in with Ethereum to submit your score.',
        uri: typeof window !== 'undefined' ? window.location.origin : '',
        version: '1',
        chainId: 84532,
        nonce,
      });

      const message = siweMessage.prepareMessage();
      const signature = await signer.signMessage(message);

      console.log('Submitting score to API at:', `${apiUrl}/send-score`);
      
      const apiResponse = await fetch(`${apiUrl}/send-score`, {
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

      console.log('Score submission response status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Score submission error:', errorData);
        throw new Error(errorData.error || 'Failed to submit score');
      }

      onSubmitComplete();
    } catch (error) {
      console.error('Submit score error:', error);
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
      {isSubmitting ? 'Submitting your score...' : 'Submit Score'}
    </Button>
  );
}