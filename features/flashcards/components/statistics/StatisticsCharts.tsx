'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/components/ui/chart'

interface DataFetchResult {
  data: any[]
  actualTimeRange: "week" | "month" | "all"
  requestedTimeRange: "week" | "month"
  fallbackUsed: boolean
  message?: string
}

interface StatisticsChartsProps {
  chartData: any[]
  dataFetchResult: DataFetchResult | null
  timeRange: "week" | "month"
}

const chartConfig = {
  flashcards_reviewed: {
    label: "Flashcards Reviewed",
    color: "#007bff",
  },
  correct_answers: {
    label: "Correct Answers",
    color: "#00FF7F",
  },
  accuracy_rate: {
    label: "Accuracy Rate (%)",
    color: "#007bff",
  },
}

const LearningTrendChart = memo(function LearningTrendChart({ chartData, dataFetchResult }: { chartData: any[], dataFetchResult: DataFetchResult | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Review Progress</CardTitle>
        <CardDescription>
          Track your daily flashcard review activity
          {dataFetchResult?.fallbackUsed && (
            <Badge variant="outline" className="ml-2 text-xs">
              {dataFetchResult.actualTimeRange === "all" ? "All time" : dataFetchResult.actualTimeRange} data
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="flashcards_reviewed"
                stroke="#007bff"
                strokeWidth={2}
                dot={{ fill: "#FFFFFF" }}
              />
              <Line
                type="monotone"
                dataKey="correct_answers"
                stroke="#00FF7F"
                strokeWidth={2}
                dot={{ fill: "#FFFFFF" }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected time period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

const AccuracyChart = memo(function AccuracyChart({ chartData, dataFetchResult }: { chartData: any[], dataFetchResult: DataFetchResult | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accuracy by Day</CardTitle>
        <CardDescription>
          Monitor your learning accuracy over time
          {dataFetchResult?.fallbackUsed && (
            <Badge variant="outline" className="ml-2 text-xs">
              {dataFetchResult.actualTimeRange === "all" ? "All time" : dataFetchResult.actualTimeRange} data
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="accuracy_rate"
                fill="#007bff"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available for the selected time period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export const StatisticsCharts = memo(function StatisticsCharts({ chartData, dataFetchResult, timeRange }: StatisticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <LearningTrendChart chartData={chartData} dataFetchResult={dataFetchResult} />
      <AccuracyChart chartData={chartData} dataFetchResult={dataFetchResult} />
    </div>
  )
})
