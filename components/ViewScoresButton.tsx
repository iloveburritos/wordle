import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { fetchScoresForCurrentGame, getWalletTokenIds } from '@/lib/utils';
import { decryptStringWithContractConditions } from '@/lib/litUtils';
import { Loader2 } from 'lucide-react';

interface ViewScoresButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  label?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onProgressChange?: (progress: number) => void;
}

interface NewUserEntry {
  id: string;
  user: string;
  tokenId: string;
}

interface ScoreEntry {
  id: string;
  user: string;
  ciphertext: string;
  datatoencrypthash: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface WalletsByTokenId {
  [tokenId: string]: Set<string>;
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

interface SubgraphResponse {
  data?: {
    newUsers?: NewUserEntry[];
    scoreAddeds?: ScoreEntry[];
  };
}

export default function ViewScoresButton({ 
  variant = 'outline',
  className = '',
  label = 'See Results',
  onSuccess,
  onError,
  onLoadingChange,
  onProgressChange
}: ViewScoresButtonProps) {
  const router = useRouter();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleViewScores = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);
      setProgress(0);
      onProgressChange?.(0);

      if (!wallets?.[0]) {
        throw new Error("Please connect your wallet first");
      }

      // 1. Get current game ID from smart contract
      const provider = new ethers.providers.Web3Provider(await wallets[0].getEthereumProvider());
      const signer = provider.getSigner();
      
      // Force switch to Base Sepolia before contract interaction
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0x14A34" }
      ]);
      
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        ["function currentGame() view returns (uint256)"],
        provider // Use provider instead of signer for read-only call
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
        newUsers(
          where: {
            tokenId_in: ${JSON.stringify(userTokenIds.map(String))}
          }
          orderBy: tokenId
          orderDirection: asc
          first: 1000
        ) {
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

      const walletsData: SubgraphResponse = await walletsResponse.json();
      if (!walletsData?.data?.newUsers) {
        throw new Error("No users found in your groups");
      }

      // Group wallets by tokenId
      const walletsByTokenId = walletsData.data.newUsers.reduce((acc: WalletsByTokenId, entry: NewUserEntry) => {
        if (!acc[entry.tokenId]) {
          acc[entry.tokenId] = new Set<string>();
        }
        acc[entry.tokenId].add(entry.user.toLowerCase());
        return acc;
      }, {} as WalletsByTokenId);

      console.log("Wallets by token ID:", walletsByTokenId);

      // 4. Get scores for current game from these wallets
      const walletAddresses = Object.values(walletsByTokenId)
        .flatMap(wallets => Array.from(wallets as Set<string>))
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const scoresQuery = `{
        scoreAddeds(
          where: {
            gameId: "${currentGameId.toString()}"
            user_in: ${JSON.stringify(walletAddresses.map(addr => addr.toLowerCase()))}
          }
          orderBy: blockTimestamp
          orderDirection: desc
          first: 1000
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

      // 5. Decrypt scores using Lit Protocol
      const decryptedResults: DecryptedResult[] = [];
      const totalScores = data.scoreAddeds.length;
      
      for (const [index, entry] of data.scoreAddeds.entries()) {
        try {
          const currentProgress = Math.floor((index / totalScores) * 100);
          setProgress(currentProgress);
          onProgressChange?.(currentProgress);

          // Find all tokenIds this wallet belongs to
          const userTokenIds = Object.entries(walletsByTokenId)
            .filter(([_, wallets]) => Array.from(wallets as Set<string>).some(wallet => 
              wallet.toLowerCase() === entry.user.toLowerCase()
            ))
            .map(([tokenId]) => tokenId);
            
          if (userTokenIds.length === 0) {
            console.warn(`Could not find tokenId for user ${entry.user}`);
            continue;
          }

          // Skip if missing encryption data
          if (!entry.ciphertext || !entry.datatoencrypthash) {
            console.warn(`Missing encryption data for user ${entry.user}`);
            continue;
          }

          const decryptedString = await decryptStringWithContractConditions(
            entry.ciphertext,
            entry.datatoencrypthash,
            signer,
            "baseSepolia"
          );

          if (!decryptedString) {
            console.warn(`Decryption failed for user ${entry.user}`);
            continue;
          }

          // Add a result for each group the user is in
          for (const tokenId of userTokenIds) {
            console.log(`Adding score for user ${entry.user} in group ${tokenId}`);
            decryptedResults.push({
              tokenId,
              score: decryptedString,
              user: entry.user,
              timestamp: parseInt(entry.blockTimestamp)
            });
          }
        } catch (error) {
          console.error(`Error processing score for user ${entry.user}:`, error);
          continue;
        }
      }

      setProgress(100);
      onProgressChange?.(100);

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

      onSuccess?.();
      router.push(`/results?stats=${queryString}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error viewing scores:', error);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
      setProgress(0);
      onProgressChange?.(0);
    }
  };

  return (
    <Button 
      onClick={handleViewScores} 
      variant={variant}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {progress > 0 ? `Decrypting... ${progress}%` : 'Loading...'}
        </>
      ) : (
        label
      )}
    </Button>
  );
} 