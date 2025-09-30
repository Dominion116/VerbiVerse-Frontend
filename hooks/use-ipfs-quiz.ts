"use client"

import { useState, useCallback } from "react"
import { useQuizContract } from "@/hooks/use-quiz-contract"

export interface IPFSQuestion {
  id: number
  sourceText: string
  correctTranslation: string
  targetLanguage: string
  difficulty: "easy" | "medium" | "hard"
}

export interface IPFSBatch {
  batchId: number
  questions: IPFSQuestion[]
  createdAt: string
  difficulty: "easy" | "medium" | "hard"
  languagePair: string
}

export interface IPFSRoot {
  batches: IPFSBatch[];
}

export function useIPFSQuiz() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedBatches, setCachedBatches] = useState<Map<number, IPFSBatch>>(new Map())

  const { getQuestionsIpfsHash, isContractReady } = useQuizContract();

  const fetchFromIPFS = useCallback(async (hash: string): Promise<any> => {
    if (!hash) throw new Error("IPFS hash is not available.");

    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) return await response.json();
      } catch (gatewayError) {
        console.warn(`Gateway ${gateway} failed:`, gatewayError);
        continue;
      }
    }
    throw new Error("All IPFS gateways failed to fetch the data.");
  }, []);

  const fetchBatch = useCallback(async (batchId: number): Promise<IPFSBatch | null> => {
    if (cachedBatches.has(batchId)) {
      return cachedBatches.get(batchId)!;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isContractReady) {
        throw new Error("Wallet not connected or contract not ready.");
      }

      const rootHash = await getQuestionsIpfsHash();
      console.log("Attempting to fetch IPFS data with hash:", rootHash);

      if (!rootHash) {
        throw new Error("IPFS hash not found in smart contract. Please ensure the QUESTIONS_HASH is set correctly.");
      }

      const ipfsData: IPFSRoot = await fetchFromIPFS(rootHash);

      if (!ipfsData || !Array.isArray(ipfsData.batches)) {
        throw new Error("Invalid data structure in fetched IPFS file.");
      }

      const batch = ipfsData.batches.find(b => b.batchId === batchId);

      if (!batch) {
        throw new Error(`Batch with ID ${batchId} not found in IPFS data.`);
      }

      setCachedBatches(prev => new Map(prev.set(batchId, batch)));
      return batch;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error(`Error fetching on-chain data: ${errorMessage}`);
      setError(errorMessage);
      return null

    } finally {
      setIsLoading(false);
    }
  }, [fetchFromIPFS, cachedBatches, getQuestionsIpfsHash, isContractReady]);

  const clearCache = useCallback(() => {
    setCachedBatches(new Map());
  }, []);

  return {
    fetchBatch,
    clearCache,
    isLoading,
    error,
    cachedBatches: cachedBatches.size
  };
}
