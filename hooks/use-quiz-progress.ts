"use client"

import { useState, useCallback, useEffect } from "react"
import { useWallet } from "@/components/providers/web3-provider"

export interface QuizSession {
  id: string
  languagePair: string
  startTime: Date
  endTime?: Date
  questions: QuizQuestion[]
  currentQuestionIndex: number
  score?: number
  status: "in-progress" | "completed" | "abandoned"
}

export interface QuizQuestion {
  id: string
  text: string
  targetLanguage: string
  userAnswer: string
  timeSpent: number
  isCorrect?: boolean
}

export interface UserStats {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  totalTimeSpent: number
  languagePairStats: Record<
    string,
    {
      attempts: number
      averageScore: number
      bestScore: number
    }
  >
  streakDays: number
  lastQuizDate?: Date
}

export function useQuizProgress() {
  const { address } = useWallet()
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    languagePairStats: {},
    streakDays: 0,
  })
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)

  // Load user stats from localStorage on mount
  useEffect(() => {
    if (address) {
      const savedStats = localStorage.getItem(`quiz-stats-${address}`)
      if (savedStats) {
        const parsed = JSON.parse(savedStats)
        // Convert date strings back to Date objects
        if (parsed.lastQuizDate) {
          parsed.lastQuizDate = new Date(parsed.lastQuizDate)
        }
        setUserStats(parsed)
      }
    }
  }, [address])

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (address && userStats.totalQuizzes > 0) {
      localStorage.setItem(`quiz-stats-${address}`, JSON.stringify(userStats))
    }
  }, [address, userStats])

  const startQuiz = useCallback((languagePair: string, questions: Omit<QuizQuestion, "userAnswer" | "timeSpent">[]) => {
    const session: QuizSession = {
      id: `quiz-${Date.now()}`,
      languagePair,
      startTime: new Date(),
      questions: questions.map((q) => ({ ...q, userAnswer: "", timeSpent: 0 })),
      currentQuestionIndex: 0,
      status: "in-progress",
    }
    setCurrentSession(session)
    setQuestionStartTime(new Date())
  }, [])

  const updateAnswer = useCallback(
    (questionIndex: number, answer: string) => {
      if (!currentSession) return

      const timeSpent = questionStartTime ? Date.now() - questionStartTime.getTime() : 0

      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedQuestions = [...prev.questions]
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          userAnswer: answer,
          timeSpent: Math.max(updatedQuestions[questionIndex].timeSpent, timeSpent),
        }
        return { ...prev, questions: updatedQuestions }
      })
    },
    [currentSession, questionStartTime],
  )

  const moveToQuestion = useCallback(
    (questionIndex: number) => {
      if (!currentSession) return

      setCurrentSession((prev) => {
        if (!prev) return prev
        return { ...prev, currentQuestionIndex: questionIndex }
      })
      setQuestionStartTime(new Date())
    },
    [currentSession],
  )

  const completeQuiz = useCallback(
    (finalScore: number) => {
      if (!currentSession) return

      const completedSession: QuizSession = {
        ...currentSession,
        endTime: new Date(),
        score: finalScore,
        status: "completed",
      }

      setCurrentSession(completedSession)

      // Update user stats
      setUserStats((prev) => {
        const totalTime = completedSession.questions.reduce((sum, q) => sum + q.timeSpent, 0)
        const languagePair = completedSession.languagePair

        const newLanguagePairStats = {
          ...prev.languagePairStats,
          [languagePair]: {
            attempts: (prev.languagePairStats[languagePair]?.attempts || 0) + 1,
            averageScore: prev.languagePairStats[languagePair]
              ? (prev.languagePairStats[languagePair].averageScore * prev.languagePairStats[languagePair].attempts +
                  finalScore) /
                (prev.languagePairStats[languagePair].attempts + 1)
              : finalScore,
            bestScore: Math.max(prev.languagePairStats[languagePair]?.bestScore || 0, finalScore),
          },
        }

        const newCompletedQuizzes = prev.completedQuizzes + 1
        const newTotalQuizzes = prev.totalQuizzes + 1
        const newAverageScore = (prev.averageScore * prev.completedQuizzes + finalScore) / newCompletedQuizzes

        // Calculate streak
        const today = new Date()
        const lastQuiz = prev.lastQuizDate
        let newStreak = prev.streakDays

        if (lastQuiz) {
          const daysDiff = Math.floor((today.getTime() - lastQuiz.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff === 1) {
            newStreak += 1
          } else if (daysDiff > 1) {
            newStreak = 1
          }
        } else {
          newStreak = 1
        }

        return {
          totalQuizzes: newTotalQuizzes,
          completedQuizzes: newCompletedQuizzes,
          averageScore: newAverageScore,
          totalTimeSpent: prev.totalTimeSpent + totalTime,
          languagePairStats: newLanguagePairStats,
          streakDays: newStreak,
          lastQuizDate: today,
        }
      })

      // Save completed session to history
      if (address) {
        const history = JSON.parse(localStorage.getItem(`quiz-history-${address}`) || "[]")
        history.unshift(completedSession)
        // Keep only last 50 sessions
        if (history.length > 50) {
          history.splice(50)
        }
        localStorage.setItem(`quiz-history-${address}`, JSON.stringify(history))
      }
    },
    [currentSession, address],
  )

  const abandonQuiz = useCallback(() => {
    if (!currentSession) return

    const abandonedSession: QuizSession = {
      ...currentSession,
      endTime: new Date(),
      status: "abandoned",
    }

    setCurrentSession(null)
    setUserStats((prev) => ({ ...prev, totalQuizzes: prev.totalQuizzes + 1 }))
  }, [currentSession])

  const resetQuiz = useCallback(() => {
    setCurrentSession(null)
    setQuestionStartTime(null)
  }, [])

  return {
    currentSession,
    userStats,
    startQuiz,
    updateAnswer,
    moveToQuestion,
    completeQuiz,
    abandonQuiz,
    resetQuiz,
    questionStartTime,
  }
}
