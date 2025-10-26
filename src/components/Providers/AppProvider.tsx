"use client";

import '@solana/wallet-adapter-react-ui/styles.css';
import dynamic from 'next/dynamic';
import { ReactNode } from "react";
import { QueryProvider } from './QueryProvider';
import { SolanaProvider } from './SolanaProvider';
import { ThemeProvider } from './ThemeProvider';

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})

interface ProviderProps {
  children: ReactNode;
}

export default function Providers({ children }: ProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <QueryProvider>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}