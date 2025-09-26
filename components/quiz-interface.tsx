"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LanguageSelector } from "./language-selector"
import { QuestionCard } from "./question-card"
import { WalletConnection } from "./wallet-connection"
import { ProgressTracker } from "./progress-tracker"
import { QuizResults } from "./quiz-results"
import { QuizHistory } from "./quiz-history"
import { Globe, Wallet, Trophy, History } from "lucide-react"
import { useWallet } from "./providers/web3-provider"
import { useQuizProgress } from "@/hooks/use-quiz-progress"

interface Question {
  id: string
  text: string
  targetLanguage: string
}

interface LanguagePair {
  from: string
  to: string
  label: string
}

const mockQuestions: Question[] = [
  { id: "1", text: "Hello, how are you?", targetLanguage: "Spanish" },
  { id: "2", text: "What is your name?", targetLanguage: "Spanish" },
  { id: "3", text: "Where do you live?", targetLanguage: "Spanish" },
  { id: "4", text: "I love learning languages", targetLanguage: "Spanish" },
  { id: "5", text: "Thank you very much", targetLanguage: "Spanish" },
]

type ViewMode = "home" | "quiz" | "results" | "history"

export function QuizInterface() {
  const [selectedLanguagePair, setSelectedLanguagePair] = useState<LanguagePair>({
    from: "English",
    to: "Spanish",
    label: "English → Spanish",
  })
  const [viewMode, setViewMode] = useState<ViewMode>("home")
  const { isConnected } = useWallet()
  const [localWalletState, setLocalWalletState] = useState(false)

  const { currentSession, userStats, startQuiz, updateAnswer, moveToQuestion, completeQuiz, resetQuiz } =
    useQuizProgress()

  const handleAnswerChange = (answer: string) => {
    if (currentSession) {
      updateAnswer(currentSession.currentQuestionIndex, answer)
    }
  }

  const handleNext = () => {
    if (currentSession && currentSession.currentQuestionIndex < 4) {
      moveToQuestion(currentSession.currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSession && currentSession.currentQuestionIndex > 0) {
      moveToQuestion(currentSession.currentQuestionIndex - 1)
    }
  }

  const handleStartQuiz = () => {
    startQuiz(selectedLanguagePair.label, mockQuestions)
    setViewMode("quiz")
  }

  const handleCompleteQuiz = () => {
    // Mock scoring - in real app this would be more sophisticated
    const score = Math.floor(Math.random() * 40) + 60 // 60-100%
    completeQuiz(score)
    setViewMode("results")
  }

  const handleNewQuiz = () => {
    resetQuiz()
    setViewMode("home")
  }

  const handleGoHome = () => {
    resetQuiz()
    setViewMode("home")
  }

  // Show results if quiz is completed
  if (viewMode === "results" && currentSession?.status === "completed") {
    return <QuizResults session={currentSession} onNewQuiz={handleNewQuiz} onGoHome={handleGoHome} />
  }

  // Show history view
  if (viewMode === "history") {
    return (
      <div>
        <div className="container mx-auto px-4 py-4">
          <Button variant="outline" onClick={() => setViewMode("home")} className="mb-4">
            ← Back to Home
          </Button>
        </div>
        <QuizHistory userStats={userStats} />
      </div>
    )
  }

  // Show quiz view
  if (viewMode === "quiz" && currentSession) {
    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex]
    const currentAnswer = currentQuestion?.userAnswer || ""

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold">Translation Quiz</h1>
                  <Badge variant="secondary" className="mt-2">
                    {selectedLanguagePair.label}
                  </Badge>
                </div>
                <Button variant="outline" onClick={handleGoHome}>
                  Exit Quiz
                </Button>
              </div>

              {/* Question */}
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                onAnswerChange={handleAnswerChange}
                questionNumber={currentSession.currentQuestionIndex + 1}
              />

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevious} disabled={currentSession.currentQuestionIndex === 0}>
                  Previous
                </Button>
                <Button
                  onClick={currentSession.currentQuestionIndex === 4 ? handleCompleteQuiz : handleNext}
                  disabled={!currentAnswer.trim()}
                >
                  {currentSession.currentQuestionIndex === 4 ? "Complete Quiz" : "Next"}
                </Button>
              </div>
            </div>

            {/* Progress Sidebar */}
            <div className="lg:col-span-1">
              <ProgressTracker currentSession={currentSession} userStats={userStats} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show home view
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-balance">Translation Quiz</h1>
          </div>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Test your translation skills with our interactive quiz platform. Connect your wallet to track progress and
            earn rewards.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Setup Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Language Selection */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Language Pair
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LanguageSelector selectedPair={selectedLanguagePair} onPairChange={setSelectedLanguagePair} />
                </CardContent>
              </Card>

              {/* Wallet Connection */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Wallet Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletConnection isConnected={isConnected} onConnectionChange={setLocalWalletState} />
                </CardContent>
              </Card>
            </div>

            {/* Quiz Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-2">5</div>
                    <div className="text-sm text-muted-foreground">Questions per batch</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-2">200</div>
                    <div className="text-sm text-muted-foreground">Character limit</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-2">
                      <Trophy className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-sm text-muted-foreground">Earn rewards</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleStartQuiz} disabled={!isConnected} className="px-8 py-3 text-lg">
                Start Quiz
              </Button>
              {userStats.completedQuizzes > 0 && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setViewMode("history")}
                  className="px-8 py-3 text-lg"
                >
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              )}
            </div>
            {!isConnected && (
              <p className="text-sm text-muted-foreground text-center">Connect your wallet to start the quiz</p>
            )}
          </div>

          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <ProgressTracker currentSession={currentSession} userStats={userStats} />
          </div>
        </div>
      </div>
    </div>
  )
}
