'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { base } from 'viem/chains';

const BASE_MAINNET_NETWORK_CONFIG = {
  id: base.id,
  chainId: `0x${base.id.toString(16)}`,
  chainName: 'Base',
  rpcUrls: [base.rpcUrls.default.http[0]],
  nativeCurrency: base.nativeCurrency,
  blockExplorerUrls: [base.blockExplorers.default.url],
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
  if (!context) throw new Error('useWallet must be used within Web3Provider');
  return context;
}

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const didInit = useRef(false);

  const resetState = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setIsWrongNetwork(false);
  }, []);

  const disconnect = useCallback(async () => {
    if (!provider) return;
    try {
      await provider.disconnect();
    } catch (err) {
      // It's okay if the session was already cleared
    } finally {
      resetState();
    }
  }, [provider, resetState]);

  const switchOrAddNetwork = async () => {
    if (!provider) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_MAINNET_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_MAINNET_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add Base network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const initProvider = async () => {
      try {
        localStorage.removeItem('wc@2:client:0.3//session');

        const wcProvider = await EthereumProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          chains: [BASE_MAINNET_NETWORK_CONFIG.id],
          showQrModal: true,
          metadata: {
            name: 'VerbiVerse',
            description: 'Learn languages and earn rewards',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://verbiverse.app',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
          },
          rpcMap: {
            [BASE_MAINNET_NETWORK_CONFIG.id]: BASE_MAINNET_NETWORK_CONFIG.rpcUrls[0]
          }
        });

        setProvider(wcProvider);

        wcProvider.on('accountsChanged', (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wcProvider.on('chainChanged', (chainId: string) => {
          if (parseInt(chainId, 16) !== BASE_MAINNET_NETWORK_CONFIG.id) {
            disconnect();
          }
        });

        wcProvider.on('disconnect', () => resetState());

        if (wcProvider.session) {
          const chainId = await wcProvider.request({ method: 'eth_chainId' });
          if (chainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
            await disconnect();
          } else {
            const accounts =
              wcProvider.session.namespaces.eip155?.accounts || [];
            if (accounts.length > 0) {
              const addr = accounts[0].split(':')[2];
              setAddress(addr);
              setIsConnected(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init WalletConnect:', err);
      }
    };

    initProvider();
  }, [disconnect, resetState]);

  const connect = async () => {
    if (!provider) return;
    try {
      await provider.enable();
      const chainId = await provider.request({ method: 'eth_chainId' });

      if (chainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
        setIsWrongNetwork(true);
        await switchOrAddNetwork();

        const newChainId = await provider.request({ method: 'eth_chainId' });
        if (newChainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
          await disconnect();
          return;
        }
      }

      setIsWrongNetwork(false);
      const accounts = await provider.request({ method: 'eth_accounts' });
      setAddress(accounts[0] || null);
      setIsConnected(accounts.length > 0);
    } catch (err) {
      console.error('WalletConnect connection failed:', err);
      await disconnect();
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        switchOrAddNetwork,
        address,
        isConnected,
        isWrongNetwork,
        provider,
      }}>
      {children}
    </WalletContext.Provider>
  );
}
