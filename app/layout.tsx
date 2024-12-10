// app/layout.tsx

// app/layout.tsx
import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "@/components/Header";
import { PrivyWrapper } from '@/components/PrivyWrapper';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Wordl3",
  description: "Share your wordl3 score without giving away any hints or clues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyWrapper>
          <Header />
          <main className="pt-[88px]">
            {children}
          </main>
        </PrivyWrapper>
      </body>
    </html>
  );
}