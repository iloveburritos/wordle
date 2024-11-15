// components/PrivyWrapper.tsx

'use client';

import { useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export const PrivyWrapper = ({ children }: { children: React.ReactNode }) => {
  // Use useEffect to log when the component mounts
  useEffect(() => {
    console.log("PrivyWrapper loaded and PrivyProvider is now wrapping the app.");
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ''}
      config={{
        appearance: {
          landingHeader: 'Welcome to onchain Wordle',
          loginMessage: 'Sign in to share your scores with friends', 
          theme: 'dark',
        }
      }}
      
    >
      {children}
    </PrivyProvider>
  );
}