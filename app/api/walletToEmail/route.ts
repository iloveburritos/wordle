import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    // Query Privy for users with this wallet
    const users = await privy.getUserByWalletAddress(walletAddress.toLowerCase());
    
    if (!users) {
      return NextResponse.json({ email: null }, { status: 200 });
    }

    // Get the first user's email
    const email = users.email?.address || null;

    return NextResponse.json({ email }, { status: 200 });
  } catch (error) {
    console.error('Error in walletToEmail:', error);
    return NextResponse.json(
      { error: 'Failed to resolve wallet to email' },
      { status: 500 }
    );
  }
} 