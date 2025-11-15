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
        <CardTitle className="text-lg md:text-xl">Daily Review Progress</CardTitle>
        <CardDescription className="text-sm">
          Track your daily flashcard review activity
          {dataFetchResult?.fallbackUsed && (
            <Badge variant="outline" className="ml-2 text-xs">
              {dataFetchResult.actualTimeRange === "all" ? "All time" : dataFetchResult.actualTimeRange} data
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="flashcards_reviewed"
                stroke="#007bff"
                strokeWidth={2}
                dot={{ fill: "#FFFFFF", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="correct_answers"
                stroke="#00FF7F"
                strokeWidth={2}
                dot={{ fill: "#FFFFFF", r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] md:h-[300px] text-muted-foreground">
            <p className="text-sm">No data available for the selected time period</p>
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
        <CardTitle className="text-lg md:text-xl">Accuracy by Day</CardTitle>
        <CardDescription className="text-sm">
          Monitor your learning accuracy over time
          {dataFetchResult?.fallbackUsed && (
            <Badge variant="outline" className="ml-2 text-xs">
              {dataFetchResult.actualTimeRange === "all" ? "All time" : dataFetchResult.actualTimeRange} data
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="accuracy_rate"
                fill="#007bff"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] md:h-[300px] text-muted-foreground">
            <p className="text-sm">No data available for the selected time period</p>
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
