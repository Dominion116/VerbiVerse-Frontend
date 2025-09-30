"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Check, Loader2 } from "lucide-react";
import { useWallet } from "./providers/web3-provider";

export function WalletConnection() {
  const { isConnected: walletConnected, address, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (walletConnected && address) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <Check className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-medium">Wallet Connected</div>
            <div className="text-sm text-muted-foreground font-mono">{formatAddress(address)}</div>
          </div>
          <Badge variant="secondary">Connected</Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDisconnect} className="flex-1 bg-transparent">
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to track progress and earn rewards
        </p>
        <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Connect securely with WalletConnect
      </p>
    </div>
  );
}