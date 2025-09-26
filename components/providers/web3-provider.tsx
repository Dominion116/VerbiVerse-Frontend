"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

type WalletContextType = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  isConnected: boolean;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within Web3Provider");
  return context;
}

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  // Initialize WalletConnect provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        const wcProvider = await EthereumProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          chains: [1], // Ethereum mainnet (change to 11155111 for Sepolia testnet)
          showQrModal: true,
        });

        setProvider(wcProvider);

        wcProvider.on("accountsChanged", (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wcProvider.on("disconnect", () => {
          setAddress(null);
          setIsConnected(false);
        });
      } catch (err) {
        console.error("Failed to init WalletConnect", err);
      }
    };

    initProvider();
  }, []);

  // Connect wallet
  const connect = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.enable();
      setAddress(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      console.error("WalletConnect connection failed", err);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
  if (!provider) return;
  try {
    await provider.disconnect(); // closes WC session
  } catch (err) {
    console.warn("Provider already disconnected:", err);
  } finally {
    setAddress(null);
    setIsConnected(false);
  }
};

  return (
  <WalletContext.Provider value={{ connect, disconnect: () => provider?.disconnect(), address, isConnected }}>
    {children}
  </WalletContext.Provider>
);
}
