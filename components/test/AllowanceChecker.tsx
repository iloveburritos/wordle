import React, { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { checkIsAllowed } from '@/lib/contractUtils';
import { Button } from '@/components/ui/button';

export default function AllowanceChecker() {
  const { wallets } = useWallets();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAllowance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!wallets?.[0]) {
        throw new Error('No wallet connected');
      }

      const provider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      );

      const allowed = await checkIsAllowed(wallets[0].address, provider);
      setIsAllowed(allowed);
    } catch (err) {
      console.error('Error checking allowance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Allowance Checker</h2>
      
      <div className="space-y-4">
        <div>
          <p>Wallet: {wallets?.[0]?.address || 'Not connected'}</p>
          {isAllowed !== null && (
            <p>Status: {isAllowed ? 'Allowed' : 'Not Allowed'}</p>
          )}
          {error && (
            <p className="text-red-500">{error}</p>
          )}
        </div>

        <Button
          onClick={checkAllowance}
          disabled={isLoading || !wallets?.[0]}
        >
          {isLoading ? 'Checking...' : 'Check Allowance'}
        </Button>
      </div>
    </div>
  );
} 