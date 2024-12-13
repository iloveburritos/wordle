import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { ethers } from 'ethers';
import { ethProvider } from '@/lib/provider';
import { reverseResolveENS } from '@/lib/utils';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

async function resolveIdentifier(address: string): Promise<string | null> {
  try {
    // 1. Try Privy email first
    const user = await privy.getUserByWalletAddress(address.toLowerCase());
    if (user?.email?.address) {
      return user.email.address;
    }

    // 2. Try ENS using the utility function
    const ensName = await reverseResolveENS(address);
    if (ensName) {
      return ensName;
    }

    // 3. Return shortened wallet address as fallback
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  } catch (error) {
    console.error(`Error resolving identifier for ${address}:`, error);
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export async function POST(request: Request) {
  try {
    const { walletAddresses } = await request.json();

    if (!walletAddresses || !Array.isArray(walletAddresses)) {
      return NextResponse.json(
        { error: 'Wallet addresses array is required' },
        { status: 400 }
      );
    }

    const results: Record<string, string> = {};
    
    // Process wallets in parallel
    await Promise.all(
      walletAddresses.map(async (address) => {
        const result = await resolveIdentifier(address);
        if (result) {
          results[address] = result;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in walletToEmails:', error);
    return NextResponse.json(
      { error: 'Failed to resolve wallet identifiers' },
      { status: 500 }
    );
  }
}