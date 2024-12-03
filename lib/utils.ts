// lib/utils.ts

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ethers } from 'ethers'
import { ethProvider } from '@/lib/provider'
import { WordleABI } from "../public/contractABI.mjs"; // Adjust the path to match your project structure

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
    
    // Validate environment variables
    if (!RPC_URL || !CONTRACT_ADDRESS) {
      throw new Error('Missing environment variables: RPC_URL or CONTRACT_ADDRESS');
    }

    // Connect to provider with error handling
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    await provider.ready; // Ensure provider is connected

    // Initialize contract with validation
    const contract = new ethers.Contract(CONTRACT_ADDRESS, WordleABI, provider);
    if (!contract) {
      throw new Error('Failed to initialize contract');
    }

    // Get current game with error handling
    const currentGame = await contract.currentGame().catch((error: any) => {
      console.error('Error fetching current game:', error);
      throw new Error(`Failed to fetch current game: ${error.message}`);
    });

    console.log(`Current Game: ${currentGame.toString()}`);

    // GraphQL query with error handling
    const query = {
      query: `{ 
        scoreAddeds(where: { currentGame: ${currentGame.toString()} }) { 
          id 
          tokenId 
          user 
          encryptedScore 
          hashScore 
          currentGame 
        } 
      }`,
    };

    const response = await fetch(
      "https://api.studio.thegraph.com/query/94961/worldv4/version/latest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphQL query failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Validate response data
    if (!responseData.data || !responseData.data.scoreAddeds) {
      throw new Error('Invalid response format from GraphQL');
    }

    console.log("GraphQL Query Response:", responseData);
    return responseData;

  } catch (error) {
    console.error("Error fetching scores for the current game:", error);
    // Rethrow the error with more context
    throw new Error(`Failed to fetch scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}