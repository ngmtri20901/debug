'use client'

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/shared/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Calendar, TrendingUp, Target, Download, BookOpen, Award, Zap, BarChart3, AlertCircle, Info, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getUserDetailedStats, exportStatisticsCSV, downloadCSV } from "@/features/flashcards/services/statisticsService"
import PageWithLoading from "@/shared/components/ui/PageWithLoading"
import { useLoading } from "@/shared/hooks/use-loading"
import { StatisticsCharts } from "./StatisticsCharts"
import { StatisticsMetrics } from "./StatisticsMetrics"

interface StatisticsData {
  id: string
  date: string
  flashcards_reviewed: number
  correct_answers: number
  total_questions: number
  accuracy_rate: number
  time_spent_minutes: number
  topics_covered: string[]
  weak_topics: string[]
  learning_streak: number
}

interface User {
  id: string
  name: string
  subscription_type: "FREE" | "PLUS" | "UNLIMITED"
  streak_days: number
  coins: number
}

interface DataFetchResult {
  data: StatisticsData[]
  actualTimeRange: "week" | "month" | "all"
  requestedTimeRange: "week" | "month"
  fallbackUsed: boolean
  message?: string
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

export default function StatisticsClient() {
  const { isLoading, withLoading } = useLoading()

  const [mounted, setMounted] = useState(false)
  const [statistics, setStatistics] = useState<StatisticsData[]>([])
  const [dataFetchResult, setDataFetchResult] = useState<DataFetchResult | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<"week" | "month">("week")
  const [viewType, setViewType] = useState<"daily" | "weekly" | "monthly">("daily")
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Optimized data fetching with reduced fallback attempts
  const fetchStatisticsWithFallback = async (requestedRange: "week" | "month"): Promise<DataFetchResult> => {
    const timeRangeMapping = {
      week: { days: 7, label: "week" },
      month: { days: 30, label: "month" }
    }

    // Simplified fallback: only try the requested range and "all time" as fallback
    const requestedDays = timeRangeMapping[requestedRange].days

    try {
      console.log(`Fetching data for ${requestedDays} days (${requestedRange})...`)
      const statsData = await getUserDetailedStats(requestedDays)

      if (statsData && statsData.length > 0) {
        console.log(`Found ${statsData.length} records in ${requestedRange} range`)
        return {
          data: statsData,
          actualTimeRange: requestedRange,
          requestedTimeRange: requestedRange,
          fallbackUsed: false
        }
      }

      // If no data in requested range, try getting all available data
      console.log(`No data in ${requestedRange}, trying all time data...`)
      const allTimeData = await getUserDetailedStats(999999)

      if (allTimeData && allTimeData.length > 0) {
        return {
          data: allTimeData,
          actualTimeRange: "all",
          requestedTimeRange: requestedRange,
          fallbackUsed: true,
          message: `No data found for the selected ${requestedRange}. Showing all available data.`
        }
      }
    } catch (error) {
      console.error(`Failed to fetch statistics:`, error)
    }

    // No data found at all
    return {
      data: [],
      actualTimeRange: "all",
      requestedTimeRange: requestedRange,
      fallbackUsed: false,
      message: "No learning data found. Start reviewing flashcards to see your progress here!"
    }
  }

  // Fetch user data ONCE on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!mounted || userDataLoaded) return

      try {
        setError(null)

        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error("Auth error:", authError)
          setError("Authentication error. Please log in again.")
          return
        }

        if (!authUser) {
          setError("Please log in to view your statistics")
          return
        }

        console.log("Authenticated user ID:", authUser.id)

        // Get user profile with improved error handling
        try {
          const { data: userProfiles, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", authUser.id)

          if (profileError) {
            console.error("Profile fetch error:", profileError)
            console.error("Error code:", profileError.code)
            console.error("Error details:", profileError.details)
            console.error("Error hint:", profileError.hint)
            console.error("Error message:", profileError.message)

            // Handle specific error cases
            if (profileError.code === "PGRST116") {
              // No rows returned - need to create user profile
              console.log("No user profile found, creating minimal user data")
              setUser({
                id: authUser.id,
                name: authUser.email || "User",
                subscription_type: "FREE",
                streak_days: 0,
                coins: 0
              })
            } else {
              setError(`Profile fetch error: ${profileError.message}`)
              return
            }
          } else if (userProfiles && userProfiles.length > 0) {
            // Use the first profile if multiple exist
            setUser(userProfiles[0])
            if (userProfiles.length > 1) {
              console.warn("Multiple user profiles found, using the first one")
            }
          } else {
            // No profile found, create minimal user data
            console.log("No user profile found, creating minimal user data")
            setUser({
              id: authUser.id,
              name: authUser.email || "User",
              subscription_type: "FREE",
              streak_days: 0,
              coins: 0
            })
          }
          setUserDataLoaded(true)
        } catch (profileError) {
          console.error("User profile fetch failed:", profileError)
          // Use minimal user data
          setUser({
            id: authUser.id,
            name: authUser.email || "User",
            subscription_type: "FREE",
            streak_days: 0,
            coins: 0
          })
          setUserDataLoaded(true)
        }
      } catch (error) {
        console.error("General error:", error)
        setError("An unexpected error occurred. Please try again.")
      }
    }

    fetchUserData()
  }, [mounted, userDataLoaded])

  // Fetch statistics data when timeRange changes
  useEffect(() => {
    const fetchStatisticsData = async () => {
      if (!mounted || !userDataLoaded || isLoadingStats) return

      setIsLoadingStats(true)
      await withLoading(async () => {
        try {
          const result = await fetchStatisticsWithFallback(timeRange)
          setDataFetchResult(result)
          setStatistics(result.data)

          // Show user-friendly message if fallback was used
          if (result.fallbackUsed && result.message) {
            toast.info(result.message, { duration: 5000 })
          }
        } catch (statsError) {
          console.error("Statistics fetch failed:", statsError)
          // Set empty result with error message
          setDataFetchResult({
            data: [],
            actualTimeRange: "all",
            requestedTimeRange: timeRange,
            fallbackUsed: false,
            message: "Failed to load statistics. Please try again later."
          })
          setStatistics([])
        } finally {
          setIsLoadingStats(false)
        }
      })
    }

    fetchStatisticsData()
  }, [timeRange, mounted, userDataLoaded])

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (!statistics.length) return null

    const totalFlashcards = statistics.reduce((sum, stat) => sum + stat.flashcards_reviewed, 0)
    const totalCorrect = statistics.reduce((sum, stat) => sum + stat.correct_answers, 0)
    const totalQuestions = statistics.reduce((sum, stat) => sum + stat.total_questions, 0)
    const totalTime = statistics.reduce((sum, stat) => sum + stat.time_spent_minutes, 0)
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

    const allTopics = new Set<string>()
    statistics.forEach(stat => {
      stat.topics_covered.forEach(topic => allTopics.add(topic))
    })

    return {
      totalFlashcards,
      totalCorrect,
      totalQuestions,
      totalTime,
      averageAccuracy,
      uniqueTopics: allTopics.size,
      studyDays: statistics.length,
      currentStreak: user?.streak_days || 0
    }
  }, [statistics, user])

  // Process data for charts
  const chartData = useMemo(() => {
    return statistics.map(stat => ({
      date: new Date(stat.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }),
      flashcards_reviewed: stat.flashcards_reviewed,
      correct_answers: stat.correct_answers,
      accuracy_rate: stat.accuracy_rate,
    }))
  }, [statistics])

  // Export functionality for Plus and Unlimited users
  const handleExport = async (format: "PDF" | "CSV") => {
    if (user?.subscription_type !== "PLUS" && user?.subscription_type !== "UNLIMITED") {
      toast.error("Export feature is available for Plus and Unlimited users only")
      return
    }

    await withLoading(async () => {
      try {
        if (format === "CSV") {
          const daysBack = timeRange === "week" ? 7 : 30
          const csvContent = await exportStatisticsCSV(daysBack)

          if (csvContent) {
            downloadCSV(csvContent, `flashcard-statistics-${timeRange}.csv`)
            toast.success("Statistics exported successfully!")
          } else {
            toast.error("Failed to export statistics")
          }
        } else {
          toast.info("PDF export coming soon!")
        }
      } catch (error) {
        console.error("Export error:", error)
        toast.error("Failed to export statistics")
      }
    })
  }

  // Get encouragement message based on user's situation
  const getEncouragementMessage = () => {
    if (!user) return "Start your Vietnamese learning journey today!"

    const hasStreak = user.streak_days > 0
    const streakDays = user.streak_days

    if (streakDays === 0) {
      return "Ready to start your learning streak? Review some flashcards today!"
    } else if (streakDays < 3) {
      return `Great start! You have a ${streakDays}-day streak. Keep it going!`
    } else if (streakDays < 7) {
      return `Amazing! You have a ${streakDays}-day streak. You're building a great habit!`
    } else {
      return `Incredible ${streakDays}-day streak! You're a Vietnamese learning champion!`
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  if (error) {
    return (
      <PageWithLoading isLoading={isLoading}>
        <div className="container mx-auto py-10 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Unable to Load Statistics</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWithLoading>
    )
  }

  // Enhanced empty state when no statistics are available
  if (!aggregateStats) {
    return (
      <PageWithLoading isLoading={isLoading}>
        <div className="container mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Flashcard Review Statistics</h1>
            <p className="text-muted-foreground mt-1">
              Track your Vietnamese learning progress and achievements
            </p>
          </div>
        </div>

        {/* Data Range Info */}
        {dataFetchResult?.message && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    {dataFetchResult.message}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                    {getEncouragementMessage()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Empty State */}

        </div>
      </PageWithLoading>
    )
  }

  return (
    <PageWithLoading isLoading={isLoading}>
      <div className="container mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flashcard Review Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Track your Vietnamese learning progress and achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Data Range Notification */}
      {dataFetchResult?.fallbackUsed && dataFetchResult?.message && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Data Range Adjusted
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  {dataFetchResult.message}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Showing data from: {dataFetchResult.actualTimeRange === "all" ? "All time" : dataFetchResult.actualTimeRange}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Section - Key Metrics */}
      <StatisticsMetrics aggregateStats={aggregateStats} />

      {/* Enhanced Motivational Message */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Amazing progress! You've reviewed {aggregateStats.totalFlashcards} flashcards
                {dataFetchResult?.fallbackUsed
                  ? ` in the past ${dataFetchResult.actualTimeRange === "all" ? "period" : dataFetchResult.actualTimeRange}`
                  : ` this ${timeRange}`
                }!
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {aggregateStats.averageAccuracy >= 80
                  ? "Excellent accuracy rate! You're mastering Vietnamese vocabulary!"
                  : aggregateStats.averageAccuracy >= 60
                  ? "Good progress! Keep practicing to improve your accuracy!"
                  : "Keep going! Every review session brings you closer to fluency!"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <StatisticsCharts
        chartData={chartData}
        dataFetchResult={dataFetchResult}
        timeRange={timeRange}
      />

      {/* Goals & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Goals
            </CardTitle>
            <CardDescription>
              Set and track your daily learning objectives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Daily Review Goal</p>
                <p className="text-sm text-muted-foreground">Review 20 flashcards daily</p>
              </div>
              <Badge variant="outline">
                {Math.round(aggregateStats.totalFlashcards / Math.max(aggregateStats.studyDays, 1))}/20
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Accuracy Target</p>
                <p className="text-sm text-muted-foreground">Maintain 80% accuracy</p>
              </div>
              <Badge variant={aggregateStats.averageAccuracy >= 80 ? "default" : "secondary"}>
                {aggregateStats.averageAccuracy.toFixed(1)}%
              </Badge>
            </div>
            <Button asChild className="w-full">
              <Link href="/quests">
                <Award className="w-4 h-4 mr-2" />
                View All Quests
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Personalized suggestions to improve your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aggregateStats.averageAccuracy < 70 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Focus on Review
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your accuracy is below 70%. Try reviewing saved cards more frequently.
                </p>
              </div>
            )}

            {aggregateStats.currentStreak < 3 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Build Consistency
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Try to study every day to build a learning streak.
                </p>
              </div>
            )}

            {aggregateStats.uniqueTopics < 3 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Explore New Topics
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Try studying flashcards from different topics to expand your vocabulary.
                </p>
              </div>
            )}

            {aggregateStats.averageAccuracy >= 80 && aggregateStats.currentStreak >= 7 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Excellent Work!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You're doing great! Consider challenging yourself with harder topics.
                </p>
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/flashcards">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Flashcards
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Section for Plus Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
            {(user?.subscription_type === "PLUS" || user?.subscription_type === "UNLIMITED") && (
              <Badge className="ml-2">Plus Feature</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Download your detailed learning data for external analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(user?.subscription_type === "PLUS" || user?.subscription_type === "UNLIMITED") ? (
            <div className="flex gap-3">
              <Button onClick={() => handleExport("CSV")} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button onClick={() => handleExport("PDF")} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-3">
                Export functionality is available for Plus and Unlimited users
              </p>
              <Button asChild>
                <Link href="/plans">
                  Upgrade to Plus
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PageWithLoading>
  )
}
