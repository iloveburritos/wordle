// pages/_app.tsx

import { AppProps } from 'next/app';
import '../styles/globals.css';
import { PrivyWrapper } from '@/components/PrivyWrapper';
import Head from 'next/head';
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
      
        <PrivyWrapper>
          <SmartWalletsProvider>
          <Head>
            <title>Wordle</title>
            <meta property="og:type" content="website" />
            <meta property="og:title" content="On-Chain Wordle" />
            <link rel="icon" href="/favicon.ico" />
      </Head>
        <Component {...pageProps} />
        </SmartWalletsProvider>
        </PrivyWrapper>
    
    
  );
}