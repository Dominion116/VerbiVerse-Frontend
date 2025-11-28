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

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_MAINNET_NETWORK_CONFIG = {
  id: base.id,
  chainId: `0x${base.id.toString(16)}`,
  chainName: 'Base',
  rpcUrls: [base.rpcUrls.default.http[0]],
  nativeCurrency: base.nativeCurrency,
  blockExplorerUrls: [base.blockExplorers.default.url],
};

type WalletContextType = {
  connect: (preferBrowserWallet?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  switchOrAddNetwork: () => Promise<void>;
  address: string | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
  provider: any;
  hasBrowserWallet: boolean;
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
  const [hasBrowserWallet, setHasBrowserWallet] = useState(false);
  const [wcProvider, setWcProvider] = useState<any>(null);

  const didInit = useRef(false);

  const resetState = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setIsWrongNetwork(false);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      // Disconnect WalletConnect if it's the active provider
      if (wcProvider && wcProvider.session) {
        await wcProvider.disconnect();
      }
      
      // For browser wallets, just reset the state (they don't have a disconnect method)
      // The user would need to disconnect from the wallet extension itself
    } catch (err) {
      console.warn('Disconnect error (this is usually fine):', err);
    } finally {
      setProvider(null);
      resetState();
    }
  }, [wcProvider, resetState]);

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

    // Check if browser wallet is available
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasBrowserWallet(true);
      console.log('Browser wallet detected');
    }

    const initProvider = async () => {
      try {
        // Clear all WalletConnect storage to prevent conflicts
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('wc@2') || key.startsWith('WALLETCONNECT')) {
            localStorage.removeItem(key);
          }
        });

        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        
        if (!projectId) {
          console.error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
          return;
        }

        console.log('Initializing WalletConnect with project ID:', projectId.substring(0, 8) + '...');

        const wc = await EthereumProvider.init({
          projectId,
          chains: [BASE_MAINNET_NETWORK_CONFIG.id],
          showQrModal: true,
          relayUrl: 'wss://relay.walletconnect.com',
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

        console.log('WalletConnect provider initialized successfully');
        setWcProvider(wc);

        wc.on('accountsChanged', (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wc.on('chainChanged', (chainId: string) => {
          if (parseInt(chainId, 16) !== BASE_MAINNET_NETWORK_CONFIG.id) {
            disconnect();
          }
        });

        wc.on('disconnect', () => resetState());

        if (wc.session) {
          const chainId = await wc.request({ method: 'eth_chainId' });
          if (chainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
            await disconnect();
          } else {
            const accounts =
              wc.session.namespaces.eip155?.accounts || [];
            if (accounts.length > 0) {
              const addr = accounts[0].split(':')[2];
              setAddress(addr);
              setIsConnected(true);
              setProvider(wc);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init WalletConnect:', err);
        console.error('Error details:', err instanceof Error ? err.message : String(err));
      }
    };

    initProvider();
  }, [disconnect, resetState]);

  const connect = async (preferBrowserWallet = true) => {
    try {
      // Try browser wallet first if preferred and available
      if (preferBrowserWallet && hasBrowserWallet && window.ethereum) {
        console.log('Connecting to browser wallet...');
        const browserProvider = window.ethereum;
        
        const accounts = await browserProvider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          setProvider(browserProvider);
          setAddress(accounts[0]);
          setIsConnected(true);

          // Setup browser wallet listeners
          browserProvider.on('accountsChanged', (accs: string[]) => {
            setAddress(accs[0] || null);
            setIsConnected(accs.length > 0);
          });

          browserProvider.on('chainChanged', () => {
            window.location.reload();
          });

          // Check network
          const chainId = await browserProvider.request({ method: 'eth_chainId' });
          if (parseInt(chainId, 16) !== BASE_MAINNET_NETWORK_CONFIG.id) {
            setIsWrongNetwork(true);
            await switchOrAddNetwork();
          } else {
            setIsWrongNetwork(false);
          }
          return;
        }
      }

      // Fall back to WalletConnect
      if (wcProvider) {
        console.log('Connecting to WalletConnect...');
        await wcProvider.enable();
        const chainId = await wcProvider.request({ method: 'eth_chainId' });

        if (chainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
          setIsWrongNetwork(true);
          await switchOrAddNetwork();

          const newChainId = await wcProvider.request({ method: 'eth_chainId' });
          if (newChainId !== BASE_MAINNET_NETWORK_CONFIG.id) {
            await disconnect();
            return;
          }
        }

        setIsWrongNetwork(false);
        const accounts = await wcProvider.request({ method: 'eth_accounts' });
        setAddress(accounts[0] || null);
        setIsConnected(accounts.length > 0);
        setProvider(wcProvider);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
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
        hasBrowserWallet,
      }}>
      {children}
    </WalletContext.Provider>
  );
}
