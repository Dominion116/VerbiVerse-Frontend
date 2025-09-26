"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Clock, Target, RotateCcw, Home } from "lucide-react"
import type { QuizSession } from "@/hooks/use-quiz-progress"

interface QuizResultsProps {
  session: QuizSession
  onNewQuiz: () => void
  onGoHome: () => void
}

export function QuizResults({ session, onNewQuiz, onGoHome }: QuizResultsProps) {
  if (!session.score || !session.endTime) return null

  const totalTime = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)
  const averageTimePerQuestion = Math.round(totalTime / session.questions.length)
  const scoreColor = session.score >= 80 ? "text-green-500" : session.score >= 60 ? "text-yellow-500" : "text-red-500"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Quiz Complete!</h1>
          </div>
          <p className="text-muted-foreground">Great job on completing the {session.languagePair} quiz</p>
        </div>

        {/* Score Card */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-center">Your Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-6xl font-bold mb-4 ${scoreColor}`}>{session.score}%</div>
            <Progress value={session.score} className="h-4 mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalTime}s</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{averageTimePerQuestion}s</div>
                <div className="text-sm text-muted-foreground">Avg per Question</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">5/5</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Question {index + 1}</Badge>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{Math.round(question.timeSpent / 1000)}s</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Original:</div>
                    <div className="font-medium">{question.text}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Your Answer:</div>
                    <div className="font-medium">{question.userAnswer}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={onNewQuiz} size="lg" className="px-8">
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Another Quiz
          </Button>
          <Button onClick={onGoHome} variant="outline" size="lg" className="px-8 bg-transparent">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
