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

// Main data structure expected from IPFS
export interface IPFSRoot {
  batches: IPFSBatch[];
}

export function useIPFSQuiz() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedBatches, setCachedBatches] = useState<Map<number, IPFSBatch>>(new Map())

  // Get contract functions
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
          signal: AbortSignal.timeout(10000) // 10s timeout
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

    if (!isContractReady) {
      setError("The wallet is not connected or the contract is not ready.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rootHash = await getQuestionsIpfsHash();
      if (!rootHash) {
        throw new Error("Could not retrieve the IPFS hash from the smart contract.");
      }

      const ipfsData: IPFSRoot = await fetchFromIPFS(rootHash);

      if (!ipfsData || !Array.isArray(ipfsData.batches)) {
        throw new Error("Invalid data structure received from IPFS.");
      }

      const batch = ipfsData.batches.find(b => b.batchId === batchId);

      if (!batch) {
        throw new Error(`Batch with ID ${batchId} was not found in the IPFS data.`);
      }

      setCachedBatches(prev => new Map(prev.set(batchId, batch)));
      return batch;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Failed to fetch batch from IPFS:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromIPFS, cachedBatches, getQuestionsIpfsHash, isContractReady]);

  const validateAnswer = useCallback((userAnswer: string, correctAnswer: string): boolean => {
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .trim()
          .replace(/[.,!?¡¿;:]/g, '')
          .replace(/\s+/g, ' ');
    return normalizeText(userAnswer) === normalizeText(correctAnswer);
  }, []);

  const calculateScore = useCallback((questions: IPFSQuestion[], userAnswers: string[]): number => {
    if (questions.length !== userAnswers.length) {
      throw new Error("Questions and answers length mismatch");
    }
    let correctAnswers = 0;
    for (let i = 0; i < questions.length; i++) {
      if (validateAnswer(userAnswers[i], questions[i].correctTranslation)) {
        correctAnswers++;
      }
    }
    return Math.round((correctAnswers / questions.length) * 100);
  }, [validateAnswer]);

  const clearCache = useCallback(() => {
    setCachedBatches(new Map());
  }, []);

  return {
    fetchBatch,
    validateAnswer,
    calculateScore,
    clearCache,
    isLoading,
    error,
    cachedBatches: cachedBatches.size
  };
}
