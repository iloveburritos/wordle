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
        scoreAddeds(
          where: { gameId: "${currentGame.toString()}" }
          orderBy: blockTimestamp
          orderDirection: desc
        ) { 
          id 
          gameId
          user
          ciphertext
          datatoencrypthash
          blockTimestamp
        } 
      }`,
    };

    console.log("Sending GraphQL query:", query);

    const response = await fetch(
      SUBGRAPH_URL,
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
      console.error('GraphQL response error:', errorText);
      throw new Error(`GraphQL query failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Raw GraphQL Response:", responseData);
    
    // Validate response data
    if (!responseData || typeof responseData !== 'object') {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format from GraphQL - response is not an object');
    }

    if (!responseData.data) {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format from GraphQL - no data field');
    }

    if (!Array.isArray(responseData.data.scoreAddeds)) {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format from GraphQL - scoreAddeds is not an array');
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
    console.log('Using Graph API URL:', SUBGRAPH_URL);
    
    // Try a simple query first to verify connection
    const simpleQuery = `
      {
        newUsers(first: 5) {
          id
          tokenId
          user
        }
      }
    `;

    const simpleResponse = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: simpleQuery
      }),
    });
    
    const simpleResult = await simpleResponse.json();
    console.log('Simple query response:', simpleResult);

    // Now query for the specific user's tokens
    const query = `
      {
        newUsers(where: { user: "${walletAddress.toLowerCase()}" }) {
          id
          tokenId
          user
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query
      }),
    });

    const result = await response.json();
    console.log('Graph API response:', result);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.newUsers) {
      console.log(`No tokens found for wallet ${walletAddress}`);
      return [];
    }

    const tokenIds = result.data.newUsers.map((user: any) => Number(user.tokenId));
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