"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { History, Calendar, TrendingUp, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from "wagmi"
import type { QuizSession, UserStats } from "@/hooks/use-quiz-progress"

interface QuizHistoryProps {
  userStats: UserStats
}

export function QuizHistory({ userStats }: QuizHistoryProps) {
  const { address } = useAccount()
  const [history, setHistory] = useState<QuizSession[]>([])
  const [filteredHistory, setFilteredHistory] = useState<QuizSession[]>([])
  const [languageFilter, setLanguageFilter] = useState<string>("all")

  useEffect(() => {
    if (address) {
      const savedHistory = localStorage.getItem(`quiz-history-${address}`)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
        }))
        setHistory(parsed)
        setFilteredHistory(parsed)
      }
    }
  }, [address])

  useEffect(() => {
    if (languageFilter === "all") {
      setFilteredHistory(history)
    } else {
      setFilteredHistory(history.filter((session) => session.languagePair === languageFilter))
    }
  }, [history, languageFilter])

  const uniqueLanguagePairs = Array.from(new Set(history.map((session) => session.languagePair)))

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Quiz History
            </h1>
            <p className="text-muted-foreground mt-2">Track your progress and review past performances</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userStats.completedQuizzes}</div>
                  <div className="text-sm text-muted-foreground">Total Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(userStats.averageScore)}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userStats.streakDays}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(userStats.totalTimeSpent / 1000 / 60)}m
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
              </CardContent>
            </Card>

            {/* Language Pair Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Language Pairs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(userStats.languagePairStats).map(([pair, stats]) => (
                  <div key={pair} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{pair}</span>
                      <span className="text-muted-foreground">{stats.attempts} attempts</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Avg: {Math.round(stats.averageScore)}%</span>
                      <span>Best: {Math.round(stats.bestScore)}%</span>
                    </div>
                    <Progress value={stats.averageScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* History List */}
          <div className="lg:col-span-3">
            {/* Filter */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguagePairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* History Cards */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Quiz History</h3>
                    <p className="text-muted-foreground">Complete your first quiz to see your history here</p>
                  </CardContent>
                </Card>
              ) : (
                filteredHistory.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{session.languagePair}</Badge>
                          <Badge
                            variant={session.status === "completed" ? "default" : "destructive"}
                            className="capitalize"
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.startTime)}
                        </div>
                      </div>

                      {session.status === "completed" && session.score && session.endTime && (
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(session.score)}`}>{session.score}%</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)}s
                            </div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {session.questions.filter((q) => q.userAnswer.trim()).length}
                            </div>
                            <div className="text-xs text-muted-foreground">Answered</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(
                                session.questions.reduce((sum, q) => sum + q.timeSpent, 0) /
                                  1000 /
                                  session.questions.length,
                              )}
                              s
                            </div>
                            <div className="text-xs text-muted-foreground">Avg/Q</div>
                          </div>
                        </div>
                      )}

                      {session.status === "abandoned" && (
                        <div className="text-center py-4">
                          <div className="text-muted-foreground">Quiz was not completed</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
