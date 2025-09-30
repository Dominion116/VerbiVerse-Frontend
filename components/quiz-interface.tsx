"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuestionCard } from "./question-card"
import { WalletConnection } from "./wallet-connection"
import { QuizHistory } from "./quiz-history"
import { AdminPanel } from "./admin-panel"
import { Globe, Wallet, History } from "lucide-react"
import { useWallet } from "./providers/web3-provider"
import { useQuizContract } from "@/hooks/use-quiz-contract"
import { useIPFSQuiz, type IPFSQuestion } from "@/hooks/use-ipfs-quiz"

type ViewMode = "home" | "quiz" | "history"

export function QuizInterface() {
  const { isConnected, isContractOwner } = useWallet()
  const [viewMode, setViewMode] = useState<ViewMode>("home")

  // State for the current quiz
  const [questions, setQuestions] = useState<IPFSQuestion[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Batch and submission data
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null)
  const [isSubmittingToContract, setIsSubmittingToContract] = useState(false)
  const [isStartingQuiz, setIsStartingQuiz] = useState(false)

  const {
    submitQuizAnswers,
    getRandomBatch,
    isLoading: contractLoading,
  } = useQuizContract()

  const { fetchBatch, isLoading: ipfsLoading } = useIPFSQuiz()

  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleStartQuiz = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    setIsStartingQuiz(true)

    try {
      const batchId = await getRandomBatch()
      if (batchId === undefined || batchId === null) {
        throw new Error("Could not retrieve a quiz batch from the contract.")
      }

      const batchData = await fetchBatch(batchId)
      if (!batchData) {
        throw new Error("Failed to fetch quiz questions from IPFS.")
      }

      setCurrentBatchId(batchId)
      setQuestions(batchData.questions)
      setAnswers(new Array(batchData.questions.length).fill(""))
      setCurrentQuestionIndex(0)
      setViewMode("quiz")
    } catch (error) {
      console.error("Error starting quiz:", error)
      alert(
        `Failed to start quiz: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    } finally {
      setIsStartingQuiz(false)
    }
  }

  const handleCompleteQuiz = async () => {
    if (!currentBatchId || !questions) return

    setIsSubmittingToContract(true)

    try {
      const answersForContract: [string, string, string, string, string] = [
        answers[0] || "",
        answers[1] || "",
        answers[2] || "",
        answers[3] || "",
        answers[4] || "",
      ]

      const correctAnswers: [string, string, string, string, string] = questions.map(q => q.correctTranslation) as [string, string, string, string, string]

      const txHash = await submitQuizAnswers(
        currentBatchId,
        answersForContract,
        correctAnswers,
        0 // Score is calculated on-chain now
      )

      if (txHash) {
        resetQuizState()
        setViewMode("history") 
      } else {
        throw new Error("Failed to get transaction hash from submission")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert(
        `Error submitting quiz: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      )
    } finally {
      setIsSubmittingToContract(false)
    }
  }

  const resetQuizState = () => {
    setQuestions([])
    setAnswers([])
    setCurrentQuestionIndex(0)
    setCurrentBatchId(null)
    setViewMode("home")
  }

  if (viewMode === "history") {
    return (
      <div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="outline"
            onClick={() => setViewMode("home")}
            className="mb-4"
          >
            ← Back to Home
          </Button>
        </div>
        <QuizHistory />
      </div>
    )
  }

  if (viewMode === "quiz" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestionIndex]

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Translation Quiz
              </h1>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="w-fit">
                    Batch #{currentBatchId}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={resetQuizState}
              className="w-fit bg-transparent"
            >
              Exit Quiz
            </Button>
          </div>

          <QuestionCard
            question={currentQuestion}
            answer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            questionNumber={currentQuestionIndex + 1}
          />

          <div className="flex justify-between mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={
                currentQuestionIndex === questions.length - 1
                  ? handleCompleteQuiz
                  : handleNext
              }
              disabled={!currentAnswer?.trim() || isSubmittingToContract}
            >
              {isSubmittingToContract
                ? "Submitting..."
                : currentQuestionIndex === questions.length - 1
                ? "Complete Quiz"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
            <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
            Translation Quiz dApp
          </h1>
        </div>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
          Test your translation skills, submit your results to the blockchain, and track your history.
        </p>
      </div>

      <div className="max-w-md mx-auto mt-8 space-y-6">
        <Card className="border-2">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Wallet Connection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <WalletConnection />
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
            size="lg"
            onClick={handleStartQuiz}
            disabled={!isConnected || contractLoading || ipfsLoading || isStartingQuiz}
            className="w-full"
            >
            {isStartingQuiz
                ? "Loading Quiz..."
                : "Start Quiz"}
            </Button>
            <Button
                size="lg"
                variant="outline"
                onClick={() => setViewMode("history")}
                className="w-full"
                disabled={!isConnected}
            >
                <History className="h-4 w-4 mr-2" />
                View History
            </Button>
        </div>
        {!isConnected && (
            <p className="text-sm text-muted-foreground text-center px-4">
            Connect your wallet to start the quiz
            </p>
        )}

        {isContractOwner && <AdminPanel />}

      </div>
    </div>
  )
}
