"use client"

import { useState, useCallback } from "react"
import { useQuizContract } from "@/hooks/use-quiz-contract"
import { getMockBatch } from "@/lib/mock-quiz-data"

// IPFS CID for the quiz data directory
const IPFS_QUIZ_ROOT_HASH = "bafybeihc4gvq5zi4ihkowt7mjdm53yliknbijd7um6ye6zdfge4vooppve";

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

      // Try to get IPFS hash from contract
      let rootHash: string | null = null;
      try {
        rootHash = await getQuestionsIpfsHash();
        console.log("IPFS hash from contract:", rootHash);
      } catch (err) {
        console.warn("Could not get IPFS hash from contract:", err);
      }

      // If no hash from contract, use the hardcoded IPFS hash
      if (!rootHash || rootHash.trim() === '') {
        console.log("Using hardcoded IPFS hash:", IPFS_QUIZ_ROOT_HASH);
        rootHash = IPFS_QUIZ_ROOT_HASH;
      }

      // Fetch the batch file directly from IPFS
      const batchFileName = `en-es-beginner-batch-${String(batchId).padStart(3, '0')}.json`;
      const batchHash = `${rootHash}/${batchFileName}`;
      
      console.log(`Fetching batch ${batchId} from IPFS:`, batchFileName);
      
      const batchData = await fetchFromIPFS(batchHash);

      if (!batchData || !Array.isArray(batchData.questions)) {
        throw new Error("Invalid batch data structure from IPFS.");
      }

      const batch: IPFSBatch = {
        batchId: batchData.batchId || batchId,
        questions: batchData.questions,
        createdAt: batchData.createdAt || new Date().toISOString(),
        difficulty: batchData.difficulty || "easy",
        languagePair: batchData.languagePair || "en-es"
      };

      setCachedBatches(prev => new Map(prev.set(batchId, batch)));
      return batch;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error(`Error fetching batch data: ${errorMessage}`);
      setError(errorMessage);
      return null;

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
