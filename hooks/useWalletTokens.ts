import { useState, useEffect } from 'react';
import { getWalletTokenIds } from '@/lib/utils';

interface UseWalletTokensResult {
  tokenIds: number[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasTokenId: (tokenId: number) => boolean;
}

export function useWalletTokens(walletAddress: string | undefined): UseWalletTokensResult {
  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokenIds = async () => {
    if (!walletAddress) {
      setTokenIds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ids = await getWalletTokenIds(walletAddress);
      setTokenIds(ids);
    } catch (err) {
      console.error('Error fetching token IDs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch token IDs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenIds();
  }, [walletAddress]);

  const hasTokenId = (tokenId: number): boolean => {
    return tokenIds.includes(tokenId);
  };

  return {
    tokenIds,
    loading,
    error,
    refetch: fetchTokenIds,
    hasTokenId
  };
} 