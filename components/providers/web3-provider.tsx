"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

type WalletContextType = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  isConnected: boolean;
  provider: any;
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

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const initProvider = async () => {
      try {
        // 🔑 Clear stale sessions (fixes "session topic doesn't exist")
        localStorage.removeItem("wc@2:client:0.3//session");

        const wcProvider = await EthereumProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          chains: [84532], // Base Sepolia Chain ID
          showQrModal: true,
        });

        setProvider(wcProvider);

        // 🔑 Restore valid session if it exists
        if (wcProvider.session) {
          const accounts = wcProvider.session.namespaces.eip155?.accounts || [];
          if (accounts.length > 0) {
            const addr = accounts[0].split(":")[2]; // format: "eip155:1:0x1234..."
            setAddress(addr);
            setIsConnected(true);
          }
        }

        wcProvider.on("accountsChanged", (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wcProvider.on("disconnect", () => {
          setAddress(null);
          setIsConnected(false);
        });
      } catch (err) {
        console.error("Failed to init WalletConnect:", err);
      }
    };

    initProvider();
  }, []);

  // 🔑 Connect wallet
  const connect = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.enable();
      setAddress(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      console.error("WalletConnect connection failed:", err);
    }
  };

  // 🔑 Disconnect wallet
  const disconnect = async () => {
    if (!provider) return;
    try {
      await provider.disconnect();
    } catch (err) {
      console.warn("Session already cleared:", err);
    } finally {
      setAddress(null);
      setIsConnected(false);
    }
  };

  return (
    <WalletContext.Provider value={{ connect, disconnect, address, isConnected, provider }}>
      {children}
    </WalletContext.Provider>
  );
}
