import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { fetchScoresForCurrentGame, getWalletTokenIds } from '@/lib/utils';
import { decryptStringWithContractConditions } from '@/lib/litUtils';
import { Loader2 } from 'lucide-react';

interface SeeResultsButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

interface DecryptedResult {
  tokenId: string;
  score: string;
  user: string;
  timestamp: number;
}

interface ResultsByGroup {
  [tokenId: string]: DecryptedResult[];
}

export default function SeeResultsButton({ variant = 'default', className }: SeeResultsButtonProps) {
  const router = useRouter();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeeResults = async () => {
    setIsLoading(true);
    
    try {
      if (!wallets?.[0]) {
        throw new Error("Please connect your wallet first");
      }

      // 1. Get current game ID from smart contract
      const provider = new ethers.providers.Web3Provider(await wallets[0].getEthereumProvider());
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        ["function currentGame() view returns (uint256)"],
        signer
      );
      const currentGameId = await contract.currentGame();
      console.log("Current game ID:", currentGameId.toString());

      // 2. Get user's token IDs
      const userTokenIds = await getWalletTokenIds(wallets[0].address);
      if (!userTokenIds || userTokenIds.length === 0) {
        throw new Error("You need to be part of a group to view stats");
      }
      console.log("User token IDs:", userTokenIds);

      // 3. Get all wallet addresses that share the same tokenIds
      const walletQuery = `{
        newUsers(where: {
          tokenId_in: ${JSON.stringify(userTokenIds.map(String))}
        }) {
          id
          user
          tokenId
        }
      }`;

      console.log("Querying wallets with shared tokenIds:", walletQuery);
      
      const walletsResponse = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: walletQuery }),
      });

      const walletsData = await walletsResponse.json();
      if (!walletsData?.data?.newUsers) {
        throw new Error("No users found in your groups");
      }

      // Group wallets by tokenId
      const walletsByTokenId = walletsData.data.newUsers.reduce((acc: any, entry: any) => {
        if (!acc[entry.tokenId]) {
          acc[entry.tokenId] = new Set<string>();
        }
        acc[entry.tokenId].add(entry.user.toLowerCase());
        return acc;
      }, {});

      console.log("Wallets by token ID:", walletsByTokenId);

      // 4. Get scores for current game from these wallets
      const walletAddresses = Object.values(walletsByTokenId)
        .flatMap(wallets => Array.from(wallets as Set<string>));

      const scoresQuery = `{
        scoreAddeds(
          where: {
            gameId: "${currentGameId.toString()}"
            user_in: ${JSON.stringify(walletAddresses.map(addr => addr.toLowerCase()))}
          }
          orderBy: blockTimestamp
          orderDirection: desc
        ) {
          id
          user
          ciphertext
          datatoencrypthash
          blockTimestamp
          transactionHash
        }
      }`;

      console.log("Querying scores for current game:", scoresQuery);

      const scoresResponse = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scoresQuery }),
      });

      const { data } = await scoresResponse.json();
      if (!data?.scoreAddeds || data.scoreAddeds.length === 0) {
        throw new Error("No scores found for the current game in your groups");
      }

      console.log("Retrieved scores:", data.scoreAddeds);

      // 5. Decrypt scores using Lit Protocol
      const decryptedResults: DecryptedResult[] = [];
      const totalScores = data.scoreAddeds.length;
      
      for (const [index, entry] of data.scoreAddeds.entries()) {
        try {
          // Find which tokenId this wallet belongs to
          const tokenId = Object.entries(walletsByTokenId)
            .find(([_, wallets]) => (wallets as Set<string>).has(entry.user.toLowerCase()))?.[0];
            
          if (!tokenId) {
            console.warn(`Could not find tokenId for user ${entry.user}`);
            continue;
          }

          console.log(`Processing score ${index + 1}/${totalScores} for user ${entry.user} in group ${tokenId}`);

          // Skip if missing encryption data
          if (!entry.ciphertext || !entry.datatoencrypthash) {
            console.warn(`Missing encryption data for user ${entry.user} in group ${tokenId}`);
            continue;
          }

          const decryptedString = await decryptStringWithContractConditions(
            entry.ciphertext,
            entry.datatoencrypthash,
            signer,
            "baseSepolia"
          );

          if (!decryptedString) {
            console.warn(`Decryption failed for user ${entry.user} in group ${tokenId}`);
            continue;
          }

          console.log(`Successfully decrypted score for user ${entry.user} in group ${tokenId}`);

          decryptedResults.push({
            tokenId,
            score: decryptedString,
            user: entry.user,
            timestamp: parseInt(entry.blockTimestamp)
          });
        } catch (error) {
          console.error(`Error processing score for user ${entry.user}:`, error);
          continue;
        }
      }

      // 6. Handle results
      if (decryptedResults.length === 0) {
        throw new Error("Could not decrypt any scores");
      }

      // Sort by timestamp (most recent first)
      decryptedResults.sort((a, b) => b.timestamp - a.timestamp);
      
      // Group by tokenId for display purposes
      const resultsByGroup = decryptedResults.reduce((acc: ResultsByGroup, result: DecryptedResult) => {
        if (!acc[result.tokenId]) {
          acc[result.tokenId] = [];
        }
        acc[result.tokenId].push(result);
        return acc;
      }, {} as ResultsByGroup);
      
      console.log("Final decrypted results:", {
        results: decryptedResults,
        groupedResults: resultsByGroup,
        currentGameId: currentGameId.toString()
      });
      
      // 7. Navigate to results page with all scores
      const queryString = encodeURIComponent(JSON.stringify({
        results: decryptedResults,
        groupedResults: resultsByGroup,
        currentGameId: currentGameId.toString()
      }));
      router.push(`/results?stats=${queryString}`);
    } catch (error) {
      console.error('Error in handleSeeResults:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(`Failed to fetch stats: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSeeResults} 
      variant={variant}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        'See Results'
      )}
    </Button>
  );
} 