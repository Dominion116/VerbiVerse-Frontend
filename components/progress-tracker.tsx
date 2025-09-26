"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Zap, Trophy } from "lucide-react"
import type { UserStats, QuizSession } from "@/hooks/use-quiz-progress"

interface ProgressTrackerProps {
  currentSession: QuizSession | null
  userStats: UserStats
  className?: string
}

export function ProgressTracker({ currentSession, userStats, className }: ProgressTrackerProps) {
  if (!currentSession) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.completedQuizzes}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.streakDays}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100
  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex]
  const answeredQuestions = currentSession.questions.filter((q) => q.userAnswer.trim()).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Quiz Progress
            </CardTitle>
            <Badge variant="secondary">
              {currentSession.currentQuestionIndex + 1}/{currentSession.questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{answeredQuestions}</div>
              <div className="text-xs text-muted-foreground">Answered</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {currentSession.questions.length - answeredQuestions}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {Math.round(currentQuestion?.timeSpent / 1000) || 0}s
              </div>
              <div className="text-xs text-muted-foreground">Current Q</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Session Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {Math.round((Date.now() - currentSession.startTime.getTime()) / 1000 / 60)}m
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {Math.round(
                  currentSession.questions.reduce((sum, q) => sum + q.timeSpent, 0) /
                    1000 /
                    currentSession.questions.length,
                ) || 0}
                s
              </div>
              <div className="text-xs text-muted-foreground">Avg per Q</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      {userStats.completedQuizzes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Overall Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{Math.round(userStats.averageScore)}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{userStats.streakDays}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
