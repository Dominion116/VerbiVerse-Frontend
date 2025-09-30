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
import { Address, createPublicClient, getContract, http } from 'viem';
import { baseSepolia } from 'viem/chains';

import { QUIZ_CONTRACT_ABI, QUIZ_CONTRACT_ADDRESS } from '@/lib/contract';

const BASE_SEPOLIA_NETWORK_CONFIG = {
  id: baseSepolia.id,
  chainId: `0x${baseSepolia.id.toString(16)}`,
  chainName: 'Base Sepolia',
  rpcUrls: [baseSepolia.rpcUrls.default.http[0]],
  nativeCurrency: baseSepolia.nativeCurrency,
  blockExplorerUrls: [baseSepolia.blockExplorers.default.url],
};

type WalletContextType = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchOrAddNetwork: () => Promise<void>;
  address: string | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
  provider: any;
  isContractOwner: boolean;
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
  const [isContractOwner, setIsContractOwner] = useState(false);

  const didInit = useRef(false);

  const resetState = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setIsWrongNetwork(false);
    setIsContractOwner(false);
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
        params: [{ chainId: BASE_SEPOLIA_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add Base Sepolia network:', addError);
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
          chains: [BASE_SEPOLIA_NETWORK_CONFIG.id],
          showQrModal: true,
        });

        setProvider(wcProvider);

        wcProvider.on('accountsChanged', (accounts: string[]) => {
          setAddress(accounts[0] || null);
          setIsConnected(accounts.length > 0);
        });

        wcProvider.on('chainChanged', (chainId: string) => {
          if (parseInt(chainId, 16) !== BASE_SEPOLIA_NETWORK_CONFIG.id) {
            disconnect();
          }
        });

        wcProvider.on('disconnect', () => resetState());

        if (wcProvider.session) {
          const chainId = await wcProvider.request({ method: 'eth_chainId' });
          if (chainId !== BASE_SEPOLIA_NETWORK_CONFIG.id) {
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

  useEffect(() => {
    const checkOwnership = async () => {
      if (address && isConnected) {
        try {
          const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(),
          });

          const contract = getContract({
            address: QUIZ_CONTRACT_ADDRESS,
            abi: QUIZ_CONTRACT_ABI,
            client: publicClient,
          });

          const ownerAddress = (await contract.read.owner()) as Address;
          setIsContractOwner(
            ownerAddress.toLowerCase() === (address as Address).toLowerCase(),
          );
        } catch (error) {
          console.error('Error checking contract ownership:', error);
          setIsContractOwner(false);
        }
      } else {
        setIsContractOwner(false);
      }
    };

    checkOwnership();
  }, [address, isConnected]);

  const connect = async () => {
    if (!provider) return;
    try {
      await provider.enable();
      const chainId = await provider.request({ method: 'eth_chainId' });

      if (chainId !== BASE_SEPOLIA_NETWORK_CONFIG.id) {
        setIsWrongNetwork(true);
        await switchOrAddNetwork();

        const newChainId = await provider.request({ method: 'eth_chainId' });
        if (newChainId !== BASE_SEPOLIA_NETWORK_CONFIG.id) {
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
        isContractOwner,
      }}>
      {children}
    </WalletContext.Provider>
  );
}
