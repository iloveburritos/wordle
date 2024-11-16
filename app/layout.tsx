// app/layout.tsx

import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "@/components/Header";
import { PrivyWrapper } from '@/components/PrivyWrapper';

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
      <body>
        <PrivyWrapper>
          <Header />
          <main className="pt-[88px]"> {/* Add padding-top to account for the fixed header */}
            {children}
          </main>
        </PrivyWrapper>
      </body>
    </html>
  );
}