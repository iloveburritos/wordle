// app/api/emailToWallet.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
)

interface EmailToWalletResponse {
  walletAddress?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailToWalletResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body as { email: string }
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const user = await privy.importUser({
      linkedAccounts: [{ type: 'email', address: email }],
      createEthereumWallet: true,
    })

    const walletAddress = user.linkedAccounts.find(account => account.type === 'wallet')?.address
    if (!walletAddress) {
      throw new Error(`No wallet address found for email ${email}`)
    }

    return res.status(200).json({ walletAddress })
  } catch (error) {
    console.error('Error resolving email to wallet address:', error)
    return res.status(500).json({ error: 'Failed to resolve email to wallet address' })
  }
}