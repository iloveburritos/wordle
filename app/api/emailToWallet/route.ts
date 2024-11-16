import { NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.NEXT_PUBLIC_PRIVY_APP_SECRET!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create or get existing user with email
    const user = await privy.importUser({
      linkedAccounts: [{ type: 'email', address: email }],
      createEthereumWallet: true,
    })

    // Get the wallet address from the user's linked accounts
    const walletAddress = user.linkedAccounts.find(
      account => account.type === 'wallet'
    )?.address

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'No wallet address found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ walletAddress })
  } catch (error) {
    console.error('Error resolving email to wallet:', error)
    return NextResponse.json(
      { error: 'Failed to resolve email to wallet' },
      { status: 500 }
    )
  }
} 