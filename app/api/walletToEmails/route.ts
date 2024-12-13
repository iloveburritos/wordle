import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(request: Request) {
  try {
    const { walletAddresses } = await request.json();

    if (!walletAddresses || !Array.isArray(walletAddresses)) {
      return NextResponse.json(
        { error: 'Wallet addresses array is required' },
        { status: 400 }
      );
    }

    const results: Record<string, string | null> = {};
    
    // Process wallets in parallel
    await Promise.all(
      walletAddresses.map(async (address) => {
        try {
          const user = await privy.getUserByWalletAddress(address.toLowerCase());
          results[address] = user?.email?.address || null;
        } catch (error) {
          console.error(`Error fetching email for wallet ${address}:`, error);
          results[address] = null;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in walletToEmails:', error);
    return NextResponse.json(
      { error: 'Failed to resolve wallets to emails' },
      { status: 500 }
    );
  }
} 