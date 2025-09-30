"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar, CheckCircle } from "lucide-react"
import { useQuizContract } from "@/hooks/use-quiz-contract"
import { type ContractSubmission } from "@/lib/contract"
import { useWallet } from "./providers/web3-provider"

export function QuizHistory() {
  const { address } = useWallet()
  const { getUserSubmissions, getSubmission, isLoading } = useQuizContract()
  const [history, setHistory] = useState<ContractSubmission[]>([])

  useEffect(() => {
    async function fetchHistory() {
      if (!address) return
      const submissionIds = await getUserSubmissions()
      if (submissionIds) {
        const submissions = await Promise.all(
          submissionIds.map(id => getSubmission(id))
        )
        setHistory(submissions.filter(s => s !== null) as ContractSubmission[])
      }
    }
    fetchHistory()
  }, [address, getUserSubmissions, getSubmission])

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp * 1000))
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-500"
    if (score >= 2) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Quiz History
            </h1>
            <p className="text-muted-foreground mt-2">Your past quiz submissions and scores</p>
          </div>
        </div>

        {isLoading && <p>Loading history...</p>}

        <div className="space-y-4">
          {history.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quiz History</h3>
                <p className="text-muted-foreground">Complete a quiz to see your history here</p>
              </CardContent>
            </Card>
          ) : (
            history.map((submission, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Batch #{submission.batchId}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(submission.timestamp)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(submission.score)}`}>{submission.score}/5</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            Submitted
                        </div>
                        <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
