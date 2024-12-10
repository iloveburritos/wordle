// lib/utils.ts

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ethers } from 'ethers'
import { ethProvider, baseProvider, getContract } from './provider'
import { SUBGRAPH_URL } from './constants'

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
    const contract = getContract();

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
      "https://api.studio.thegraph.com/query/94961/wordle31155/version/latest",
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
    throw new Error(`Failed to fetch scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getWalletTokenIds(walletAddress: string): Promise<number[]> {
  try {
    // First try a test query to verify the endpoint
    const testQuery = `
      {
        _meta {
          block {
            number
          }
          deployment
          hasIndexingErrors
        }
      }
    `;

    const testResponse = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery
      }),
    });

    const testResult = await testResponse.json();
    console.log('Graph API test response:', testResult);

    // Now query for the tokens
    const query = `
      {
        newUsers(where: { userAddress: "${walletAddress.toLowerCase()}" }) {
          id
          tokenId
          userAddress
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch token IDs from The Graph: ${errorText}`);
    }

    const result = await response.json();
    console.log('Graph API response:', result);

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data) {
      // If no data is returned but also no errors, return empty array
      console.log('No data returned from The Graph, but no errors. User might not have any tokens.');
      return [];
    }

    const tokenIds = result.data.newUsers.map((user: any) => parseInt(user.tokenId));
    console.log(`Token IDs for wallet ${walletAddress}:`, tokenIds);

    return tokenIds;
  } catch (error) {
    console.error('Error getting wallet token IDs:', error);
    throw error;
  }
}

// Function to verify if a wallet has a specific token ID
export async function verifyWalletHasTokenId(walletAddress: string, tokenId: number): Promise<boolean> {
  try {
    const tokenIds = await getWalletTokenIds(walletAddress);
    return tokenIds.includes(tokenId);
  } catch (error) {
    console.error('Error verifying wallet token:', error);
    throw error;
  }
}