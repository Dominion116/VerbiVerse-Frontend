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
      setError(errorMessage + " Displaying sample questions instead.");

      const fallbackBatch: IPFSBatch = {
        batchId,
        questions: generateFallbackQuestions(batchId),
        createdAt: new Date().toISOString(),
        difficulty: "medium",
        languagePair: "English → Spanish"
      };

      setCachedBatches(prev => new Map(prev.set(batchId, fallbackBatch)));
      return fallbackBatch;

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

function generateFallbackQuestions(batchId: number): IPFSQuestion[] {
  const questionSets: Record<number, IPFSQuestion[]> = {
    1: [
      { id: 1, sourceText: "Hello, how are you?", correctTranslation: "Hola, ¿cómo estás?", targetLanguage: "Spanish", difficulty: "easy" },
      { id: 2, sourceText: "What is your name?", correctTranslation: "¿Cómo te llamas?", targetLanguage: "Spanish", difficulty: "easy" },
      { id: 3, sourceText: "Where do you live?", correctTranslation: "¿Dónde vives?", targetLanguage: "Spanish", difficulty: "easy" },
      { id: 4, sourceText: "I love learning languages", correctTranslation: "Me encanta aprender idiomas", targetLanguage: "Spanish", difficulty: "easy" },
      { id: 5, sourceText: "Thank you very much", correctTranslation: "Muchas gracias", targetLanguage: "Spanish", difficulty: "easy" }
    ],
    2: [
      { id: 6, sourceText: "The weather is beautiful today", correctTranslation: "El clima está hermoso hoy", targetLanguage: "Spanish", difficulty: "medium" },
      { id: 7, sourceText: "I would like to order food", correctTranslation: "Me gustaría pedir comida", targetLanguage: "Spanish", difficulty: "medium" },
      { id: 8, sourceText: "Can you help me please?", correctTranslation: "¿Puedes ayudarme por favor?", targetLanguage: "Spanish", difficulty: "medium" },
      { id: 9, sourceText: "The book is on the table", correctTranslation: "El libro está sobre la mesa", targetLanguage: "Spanish", difficulty: "medium" },
      { id: 10, sourceText: "I am learning Spanish", correctTranslation: "Estoy aprendiendo español", targetLanguage: "Spanish", difficulty: "medium" }
    ]
  };

  if (!questionSets[batchId]) {
    const baseQuestions = questionSets[1];
    return baseQuestions.map((q, index) => ({
      ...q,
      id: (batchId - 1) * 5 + index + 1,
      sourceText: `${q.sourceText} (Batch ${batchId})`,
      difficulty: batchId <= 3 ? "easy" : batchId <= 7 ? "medium" : "hard" as const
    }));
  }

  return questionSets[batchId];
}