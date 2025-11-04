'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Progress } from "@/shared/components/ui/progress"
import { TrendingUp, Target, Zap, Award, BookOpen } from "lucide-react"

interface AggregateStats {
  totalFlashcards: number
  totalCorrect: number
  totalQuestions: number
  totalTime: number
  averageAccuracy: number
  uniqueTopics: number
  studyDays: number
  currentStreak: number
}

interface StatisticsMetricsProps {
  aggregateStats: AggregateStats
}

export function StatisticsMetrics({ aggregateStats }: StatisticsMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cards Reviewed</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregateStats.totalFlashcards}</div>
          <p className="text-xs text-green-600 mt-1">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            {Math.round(aggregateStats.totalFlashcards / Math.max(aggregateStats.studyDays, 1))} cards/day avg
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregateStats.averageAccuracy.toFixed(1)}%</div>
          <Progress value={aggregateStats.averageAccuracy} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aggregateStats.currentStreak} days</div>
          <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
        </CardContent>
      </Card>
    </div>
  )
}
