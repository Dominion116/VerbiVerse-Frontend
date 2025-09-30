"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

// Define the required chain ID and network details
const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_NETWORK_CONFIG = {
  chainId: "0x14A34", // Hex version of 84532
  chainName: "Base Sepolia",
  rpcUrls: ["https://sepolia.base.org"],
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

type WalletContextType = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchOrAddNetwork: () => Promise<void>;
  address: string | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
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
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const didInit = useRef(false);

  // 🔑 Disconnect wallet
  const disconnect = async () => {
    if (!provider) return;
    try {
      await provider.disconnect();
    } catch (err) {
      // It's okay if the session was already cleared
    } finally {
      setAddress(null);
      setIsConnected(false);
      setIsWrongNetwork(false);
    }
  };

  // 🔑 Function to switch to or add the Base Sepolia network
  const switchOrAddNetwork = async () => {
    if (!provider) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates the chain has not been added to the wallet.
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add Base Sepolia network:", addError);
          alert("Failed to add the Base Sepolia network to your wallet.");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        alert("Failed to switch to the Base Sepolia network. Please switch manually in your wallet.");
      }
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const initProvider = async () => {
      try {
        localStorage.removeItem("wc@2:client:0.3//session");

        const wcProvider = await EthereumProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          chains: [BASE_SEPOLIA_CHAIN_ID],
          showQrModal: true,
        });

        setProvider(wcProvider);

        // --- Event Listeners ---
        wcProvider.on("accountsChanged", (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wcProvider.on("chainChanged", (chainId: string) => {
          const newChainId = parseInt(chainId, 16);
          if (newChainId !== BASE_SEPOLIA_CHAIN_ID) {
            alert("Please switch back to the Base Sepolia network.");
            disconnect();
          }
        });

        wcProvider.on("disconnect", () => {
          setAddress(null);
          setIsConnected(false);
          setIsWrongNetwork(false);
        });

        // --- Restore Session ---
        if (wcProvider.session) {
          const chainId = await wcProvider.request({ method: 'eth_chainId' });
          if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
            alert("Please switch to the Base Sepolia network in your wallet and reconnect.");
            await disconnect();
          } else {
            const accounts = wcProvider.session.namespaces.eip155?.accounts || [];
            if (accounts.length > 0) {
              const addr = accounts[0].split(":")[2];
              setAddress(addr);
              setIsConnected(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to init WalletConnect:", err);
      }
    };

    initProvider();
  }, []);

  // 🔑 Connect wallet
  const connect = async () => {
    if (!provider) {
      console.error("WalletConnect provider not initialized");
      return;
    }
    try {
      await provider.enable();
      const chainId = await provider.request({ method: 'eth_chainId' });

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        setIsWrongNetwork(true);
        await switchOrAddNetwork();
        
        const newChainId = await provider.request({ method: 'eth_chainId' });
        if (newChainId !== BASE_SEPOLIA_CHAIN_ID) {
          await disconnect();
          return;
        }
      }

      setIsWrongNetwork(false);
      const accounts = await provider.request({ method: 'eth_accounts' });
      setAddress(accounts[0] || null);
      setIsConnected(accounts.length > 0);
    } catch (err) {
      console.error("WalletConnect connection failed:", err);
      await disconnect();
    }
  };

  return (
    <WalletContext.Provider value={{ connect, disconnect, switchOrAddNetwork, address, isConnected, isWrongNetwork, provider }}>
      {children}
    </WalletContext.Provider>
  );
}
