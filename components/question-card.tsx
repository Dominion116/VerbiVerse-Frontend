"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"

interface Question {
  id: string
  text: string
  targetLanguage: string
}

interface QuestionCardProps {
  question: Question
  answer: string
  onAnswerChange: (answer: string) => void
  questionNumber: number
}

export function QuestionCard({ question, answer, onAnswerChange, questionNumber }: QuestionCardProps) {
  const characterCount = answer.length
  const maxCharacters = 200

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Question {questionNumber}
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            Translate to {question.targetLanguage}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Original Text</label>
          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border">
            <p className="text-base sm:text-lg break-words">{question.text}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">Your Translation</label>
            <span
              className={`text-xs ${characterCount > maxCharacters ? "text-destructive" : "text-muted-foreground"}`}
            >
              {characterCount}/{maxCharacters}
            </span>
          </div>
          <Textarea
            placeholder={`Enter your ${question.targetLanguage} translation here...`}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="min-h-[100px] sm:min-h-[120px] text-base sm:text-lg"
            maxLength={maxCharacters}
          />
          {characterCount > maxCharacters && (
            <p className="text-xs text-destructive mt-1">Translation exceeds character limit</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
