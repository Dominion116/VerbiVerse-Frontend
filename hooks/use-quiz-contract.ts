"use client"

import { useState, useCallback, useEffect } from "react"
import { useWallet } from "@/components/providers/web3-provider"
import { QuizContract, type ContractSubmission } from "@/lib/contract"
import { type Hex } from "viem"

export function useQuizContract() {
  const { isConnected, address, provider } = useWallet()
  const [contract, setContract] = useState<QuizContract | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize contract when wallet is connected
  useEffect(() => {
    if (isConnected && provider) {
      const contractInstance = new QuizContract(provider)
      setContract(contractInstance)
    } else {
      setContract(null)
    }
  }, [isConnected, provider])

  const getQuestionsIpfsHash = useCallback(async (): Promise<string | null> => {
    if (!contract) return null;

    setIsLoading(true);
    setError(null);

    try {
      const hash = await contract.getQuestionsIpfsHash();
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get questions IPFS hash");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  const setQuestionsIpfsHash = useCallback(async (newHash: string): Promise<string | null> => {
    if (!contract) return null;

    setIsLoading(true);
    setError(null);

    try {
      const txHash = await contract.setQuestionsIpfsHash(newHash);
      return txHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set questions IPFS hash");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);


  const getRandomBatch = useCallback(async (): Promise<number | null> => {
    if (!contract) return null

    setIsLoading(true)
    setError(null)

    try {
      const batchId = await contract.getRandomBatch()
      return batchId
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get random batch")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [contract])

  const submitQuizAnswers = useCallback(
  async (
    batchId: number,
    answers: [string, string, string, string, string],
    correctAnswers: [string, string, string, string, string],
    score: number,
  ): Promise<string | null> => {
    if (!contract) return null;
    setIsLoading(true);
    setError(null);

    try {
      // Calculate score by comparing answers
      const score = answers.reduce((total, answer, index) => {
        return answer.toLowerCase() === correctAnswers[index].toLowerCase() ? total + 1 : total;
      }, 0);

      const txHash = await contract.submitAnswers(batchId, answers, score);
      return txHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answers");
      return null;
    } finally {
      setIsLoading(false);
    }
  },
  [contract],
);

  const getUserSubmissions = useCallback(async (): Promise<ContractSubmission[]> => {
    if (!contract || !address) return []

    setIsLoading(true)
    setError(null)

    try {
      const submissionIds = await contract.getUserSubmissions(address as Hex)
      const submissions: ContractSubmission[] = []

      // Fetch details for each submission
      for (const id of submissionIds) {
        const submission = await contract.getSubmission(id)
        if (submission) {
          submissions.push(submission)
        }
      }

      return submissions
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get user submissions")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [contract, address])

  return {
    contract,
    isLoading,
    error,
    getRandomBatch,
    getQuestionsIpfsHash,
    setQuestionsIpfsHash,
    submitQuizAnswers,
    getUserSubmissions,
    isContractReady: !!contract && isConnected,
  }
}
