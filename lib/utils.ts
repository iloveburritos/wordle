// lib/utils.ts

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ethers } from 'ethers'
import { ethProvider } from '@/lib/provider'
import { WordleABI } from "../public/contractABI.js"; // Adjust the path to match your project structure

// Combines class names
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export async function resolveAddress(identifier: string): Promise<string> {
  if (identifier.endsWith('.eth')) {
    try {
      const resolvedAddress = await ethProvider.resolveName(identifier)
      if (!resolvedAddress) {
        throw new Error(`Could not resolve ${identifier}`)
      }
      return resolvedAddress
    } catch (error) {
      console.error(`Error resolving ENS name: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error('ENS resolution failed')
    }
  }

  if (ethers.utils.isAddress(identifier)) {
    return identifier
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    try {
      const response = await fetch('/api/emailToWallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resolve email to wallet address')
      }

      const data = await response.json()
      if (!data.walletAddress) {
        throw new Error('No wallet address returned')
      }
      return data.walletAddress
    } catch (error) {
      console.error('Error resolving email to wallet address:', error)
      throw new Error(error instanceof Error ? error.message : 'Email resolution failed')
    }
  }

  throw new Error('Invalid identifier format')
}

export async function fetchScoresForCurrentGame() {
  try {
    const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address is not defined');
    }
    // Step 1: Connect to the blockchain and retrieve the currentGame number
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, WordleABI, provider);

    const currentGame = await contract.currentGame();
    console.log(`Current Game: ${currentGame.toString()}`);

    // Step 2: Define the GraphQL query with the retrieved currentGame number
    const query = {
      query: `{ 
        scoreAddeds(where: { currentGame: ${currentGame} }) { 
          id 
          tokenId 
          user 
          encryptedScore 
          hashScore 
          currentGame 
        } 
      }`,
    };

    // Step 3: Call the GraphQL endpoint
    const response = await fetch("https://api.studio.thegraph.com/query/94961/worldv4/version/latest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    // Step 4: Parse and log the response
    const responseData = await response.json();
    console.log("GraphQL Query Response:", responseData);
    return responseData;
  } catch (error) {
    console.error("Error fetching scores for the current game:", error);
  }
}