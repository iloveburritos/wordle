'use client'

import React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameResult, icons } from '../lib/types';
import { SiweMessage } from 'siwe';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

// Define interface for ciphertext and dataToEncryptHash
export interface EncryptedResult {
  ciphertext: string;
  dataToEncryptHash: string;
}

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  onSeeResults: () => void;
  gameResult: GameResult;
  message: string;
}

// Convert the board to a string grid representation
const renderGrid = (board: GameResult['board']): string => {
  return board
    .map((row) => row.map((tile) => icons[tile.state]).join(''))
    .join('\n');
};

export default function GameOverModal({
  isOpen,
  onClose,
  onSeeResults,
  gameResult,
  message
}: GameOverModalProps) {
  const router = useRouter(); // Initialize router

  const { score, board } = gameResult;
  const grid = renderGrid(board);
  const { wallets } = useWallets();
  const userWallet = wallets[0];

  const handleSeeStats = () => {
    onSeeResults(); // Optional: keep if other logic is needed
    router.push('/results');
  };

  const handleShare = async () => {
    try {
      // Step 1: Generate a nonce from the server
      const response = await fetch('http://localhost:3001/generate-nonce', {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate nonce');
      }
  
      const { token } = await response.json(); // Extract the JWT token
      const { nonce } = JSON.parse(atob(token.split('.')[1])); // Decode the nonce from the JWT payload
  
      console.log("Encrypted Info:", gameResult.encryptedString);
      
      console.log("Generated token:", token);
      console.log("Decoded nonce:", nonce);
  
      // Step 2: Initialize the signer
      const userSigner = await userWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(userSigner);
      const signer = provider.getSigner();
      const address = userWallet.address;
  
      // Step 3: Create the SIWE message
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
  
      console.log("SIWE message:", message);
      console.log("Signature:", signature);
  
      // Step 4: Send the SIWE message and JWT to the API
      const apiResponse = await fetch('http://localhost:3001/send-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message, // SIWE message
          signature,
          token, // JWT token
          score: gameResult.encryptedString, // Include any other relevant data, e.g., the game score
        }),
      });
  
      console.log("Response status:", apiResponse.status);
  
      if (!apiResponse.ok) {
        const errorDetails = await apiResponse.json();
        console.error("API Error Details:", errorDetails);
        throw new Error('Failed to send score');
      }
  
      const data = await apiResponse.json();
      console.log("Response data:", data);
  
      alert('Score shared successfully!');
    } catch (error) {
      console.error('Error sharing score:', error);
      alert('Failed to share score. Please try again later.');
    }
  };
  
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <pre>{grid}</pre>
        <DialogFooter className="sm:justify-start">
          <Button onClick={handleShare}>Share</Button>
          <Button onClick={handleSeeStats} variant="outline">See Stats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
