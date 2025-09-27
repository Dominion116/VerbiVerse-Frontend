"use client"

import { useState, useCallback } from "react"

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

export function useIPFSQuiz() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedBatches, setCachedBatches] = useState<Map<number, IPFSBatch>>(new Map())

  const fetchFromIPFS = useCallback(async (hash: string): Promise<any> => {
    try {
      // Try multiple IPFS gateways for better reliability
      const gateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`
      ]

      for (const gateway of gateways) {
        try {
          const response = await fetch(gateway, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          if (response.ok) {
            const data = await response.json()
            return data
          }
        } catch (gatewayError) {
          console.warn(`Gateway ${gateway} failed:`, gatewayError)
          continue // Try next gateway
        }
      }

      throw new Error("All IPFS gateways failed")
    } catch (err) {
      console.error("IPFS fetch error:", err)
      throw new Error(`Failed to fetch from IPFS: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const fetchBatch = useCallback(async (batchId: number): Promise<IPFSBatch | null> => {
    if (batchId < 1 || batchId > 10) {
      throw new Error("Batch ID must be between 1 and 10")
    }

    // Check cache first
    if (cachedBatches.has(batchId)) {
      return cachedBatches.get(batchId)!
    }

    setIsLoading(true)
    setError(null)

    try {
      // For now, we'll use a placeholder hash structure
      // In a real implementation, you'd fetch the actual hash from your contract
      const mockHash = `QmBatchHash${batchId}` // This would be the actual IPFS hash
      
      // Try to fetch from IPFS first
      try {
        const ipfsData = await fetchFromIPFS(mockHash)
        
        // Validate the structure
        if (ipfsData && ipfsData.questions && Array.isArray(ipfsData.questions)) {
          const batch: IPFSBatch = {
            batchId,
            questions: ipfsData.questions,
            createdAt: ipfsData.createdAt || new Date().toISOString(),
            difficulty: ipfsData.difficulty || "medium",
            languagePair: ipfsData.languagePair || "English → Spanish"
          }
          
          // Cache the result
          setCachedBatches(prev => new Map(prev.set(batchId, batch)))
          return batch
        }
      } catch (ipfsError) {
        console.warn("IPFS fetch failed, using fallback data:", ipfsError)
        // Fall back to generating sample data if IPFS fails
      }

      // Fallback: Generate sample batch data
      const fallbackBatch: IPFSBatch = {
        batchId,
        questions: generateFallbackQuestions(batchId),
        createdAt: new Date().toISOString(),
        difficulty: "medium",
        languagePair: "English → Spanish"
      }

      // Cache the fallback
      setCachedBatches(prev => new Map(prev.set(batchId, fallbackBatch)))
      return fallbackBatch

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Failed to fetch batch:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchFromIPFS, cachedBatches])

  const getRandomBatchId = useCallback((): number => {
    return Math.floor(Math.random() * 10) + 1 // Returns 1-10
  }, [])

  const validateAnswer = useCallback((userAnswer: string, correctAnswer: string): boolean => {
    // Basic answer validation - normalize and compare
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .trim()
          .replace(/[.,!?¡¿;:]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace

    return normalizeText(userAnswer) === normalizeText(correctAnswer)
  }, [])

  const calculateScore = useCallback((questions: IPFSQuestion[], userAnswers: string[]): number => {
    if (questions.length !== userAnswers.length) {
      throw new Error("Questions and answers length mismatch")
    }

    let correctAnswers = 0
    for (let i = 0; i < questions.length; i++) {
      if (validateAnswer(userAnswers[i], questions[i].correctTranslation)) {
        correctAnswers++
      }
    }

    return Math.round((correctAnswers / questions.length) * 100)
  }, [validateAnswer])

  const clearCache = useCallback(() => {
    setCachedBatches(new Map())
  }, [])

  return {
    fetchBatch,
    getRandomBatchId,
    validateAnswer,
    calculateScore,
    clearCache,
    isLoading,
    error,
    cachedBatches: cachedBatches.size
  }
}

// Helper function to generate fallback questions when IPFS is unavailable
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
  }

  // Generate more sets based on batch ID
  if (!questionSets[batchId]) {
    const baseQuestions = questionSets[1]
    return baseQuestions.map((q, index) => ({
      ...q,
      id: (batchId - 1) * 5 + index + 1,
      sourceText: `${q.sourceText} (Batch ${batchId})`,
      difficulty: batchId <= 3 ? "easy" : batchId <= 7 ? "medium" : "hard" as const
    }))
  }

  return questionSets[batchId]
}