"use client";

import { AnchorProvider, Provider } from '@coral-xyz/anchor';
import { WalletError } from '@solana/wallet-adapter-base';
import { AnchorWallet, ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Connection, PublicKey } from '@solana/web3.js';
import { ReactNode, useCallback } from "react";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const connection = new Connection("https://api.devnet.solana.com", 'confirmed')
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}

export class SimpleProvider implements Provider {
  readonly connection: Connection;
  readonly publicKey?: PublicKey;

  constructor(connection: Connection, publicKey?: PublicKey) {
    this.connection = connection;
    this.publicKey = publicKey;
  }
}