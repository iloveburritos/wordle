// pages/_app.tsx

import { AppProps } from 'next/app';
import '../styles/globals.css';
import { PrivyWrapper } from '@/components/PrivyWrapper';
import Head from 'next/head';
import Script from 'next/script';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PrivyWrapper>
      <Head>
        <title>Stoner Cats</title>
        <meta property="og:type" content="website" />
        <meta property="og:title" content="On-Chain Wordle" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
        <Component {...pageProps} />
    </PrivyWrapper>
  );
}