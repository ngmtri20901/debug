/**
 * Flashcard Statistics Utility Library (React Native version)
 * Provides functions to update and retrieve learning statistics
 */

import { supabase } from '@/shared/lib/supabase/client'

export interface PracticeSessionData {
  flashcardCount: number
  correctCount: number
  timeMinutes: number
  topics: string[]
}

export interface UserStatistics {
  totalCardsReviewed: number
  accuracyRate: number
  currentStreak: number
  totalTimeMinutes: number
  studyDaysThisMonth: number
  lastStudyDate: string | null
}

export interface DetailedStatistics {
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

// Simple in-memory cache for statistics data
interface CacheEntry {
  data: any
  timestamp: number
  expiryMs: number
}

const statisticsCache = new Map<string, CacheEntry>()
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const QUICK_STATS_CACHE_DURATION_MS = 2 * 60 * 1000 // 2 minutes for quick stats

/**
 * Get data from cache if available and not expired
 */
function getCachedData(key: string): any | null {
  const cached = statisticsCache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.timestamp + cached.expiryMs) {
    statisticsCache.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * Store data in cache
 */
function setCachedData(key: string, data: any, expiryMs: number = CACHE_DURATION_MS): void {
  statisticsCache.set(key, {
    data,
    timestamp: Date.now(),
    expiryMs
  })
}

/**
 * Clear all cached statistics data
 */
export function clearStatisticsCache(): void {
  statisticsCache.clear()
}

/**
 * Records a completed practice session and updates daily statistics
 * Call this function after a user completes a flashcard practice session
 */
export async function recordPracticeSession(sessionData: PracticeSessionData): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase.rpc('record_practice_session', {
      p_user_id: user.id,
      p_flashcard_count: sessionData.flashcardCount,
      p_correct_count: sessionData.correctCount,
      p_time_minutes: sessionData.timeMinutes,
      p_topics: sessionData.topics
    })

    if (error) {
      console.error("Error recording practice session:", error)
      return false
    }

    // Clear cache after recording a session to ensure fresh data
    clearStatisticsCache()

    return data === true
  } catch (error) {
    console.error("Failed to record practice session:", error)
    return false
  }
}

/**
 * Gets quick statistics for the current user
 * Useful for dashboard widgets and header displays
 */
export async function getUserQuickStats(): Promise<UserStatistics | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check cache first
    const cacheKey = `quick_stats_${user.id}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log("Returning cached quick stats")
      return cachedData
    }

    const { data, error } = await supabase.rpc('get_user_quick_stats', {
      p_user_id: user.id
    })

    if (error) {
      console.error("Error fetching quick stats:", error)
      return null
    }

    const result = {
      totalCardsReviewed: data.total_cards_reviewed || 0,
      accuracyRate: data.accuracy_rate || 0,
      currentStreak: data.current_streak || 0,
      totalTimeMinutes: data.total_time_minutes || 0,
      studyDaysThisMonth: data.study_days_this_month || 0,
      lastStudyDate: data.last_study_date || null
    }

    // Cache the result
    setCachedData(cacheKey, result, QUICK_STATS_CACHE_DURATION_MS)

    return result
  } catch (error) {
    console.error("Failed to fetch quick stats:", error)
    return null
  }
}

/**
 * Gets detailed statistics for the statistics dashboard with caching
 */
export async function getUserDetailedStats(daysBack: number = 30): Promise<DetailedStatistics[] | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("User not authenticated in getUserDetailedStats")
      throw new Error("User not authenticated")
    }

    // Check cache first
    const cacheKey = `detailed_stats_${user.id}_${daysBack}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`Returning cached detailed stats for ${daysBack} days`)
      return cachedData
    }

    console.log(`Fetching detailed stats for user ${user.id}, ${daysBack} days back`)

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - daysBack)
    const fromDateString = fromDate.toISOString().split("T")[0]
    
    console.log(`Query date range: from ${fromDateString} onwards`)

    const { data, error } = await supabase
      .from("flashcard_statistics")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", fromDateString)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching detailed stats:", error)
      console.error("Error code:", error.code)
      console.error("Error details:", error.details)
      console.error("Error hint:", error.hint)
      console.error("Error message:", error.message)
      return null
    }

    console.log(`Query returned ${data?.length || 0} records`)
    if (data && data.length > 0) {
      console.log("Date range of returned data:", {
        earliest: data[0].date,
        latest: data[data.length - 1].date
      })
    }

    const result = data || []
    
    // Cache the result
    setCachedData(cacheKey, result, CACHE_DURATION_MS)

    return result
  } catch (error) {
    console.error("Failed to fetch detailed stats:", error)
    return null
  }
}

/**
 * Gets the user's current learning streak with caching
 */
export async function getUserStreak(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return 0
    }

    // Check cache first
    const cacheKey = `streak_${user.id}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData !== null) {
      return cachedData
    }

    const { data: userProfiles, error } = await supabase
      .from("user_profiles")
      .select("streak_days")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching user streak:", error)
      return 0
    }

    const streak = userProfiles?.streak_days || 0
    
    // Cache the result
    setCachedData(cacheKey, streak, QUICK_STATS_CACHE_DURATION_MS)

    return streak
  } catch (error) {
    console.error("Failed to fetch user streak:", error)
    return 0
  }
}

/**
 * Check if user has any statistics data
 */
export async function hasStatisticsData(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    // Check cache first
    const cacheKey = `has_data_${user.id}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData !== null) {
      return cachedData
    }

    const { data, error } = await supabase
      .from("flashcard_statistics")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (error) {
      console.error("Error checking for statistics data:", error)
      return false
    }

    const hasData = (data && data.length > 0)
    
    // Cache the result for a shorter time since this can change quickly
    setCachedData(cacheKey, hasData, 60 * 1000) // 1 minute cache

    return hasData
  } catch (error) {
    console.error("Failed to check for statistics data:", error)
    return false
  }
}

/**
 * Export user statistics as CSV
 * Available for Plus and Unlimited users only
 */
export async function exportStatisticsCSV(daysBack: number = 30): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check user subscription
    const { data: userProfiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("subscription_type")
      .eq("id", user.id)

    if (profileError) {
      console.error("Error fetching user profile for export:", profileError)
      throw new Error("Failed to verify subscription status")
    }

    const userProfile = userProfiles?.[0]
    if (!userProfile || (userProfile.subscription_type !== "PLUS" && userProfile.subscription_type !== "UNLIMITED")) {
      throw new Error("CSV export is available for Plus and Unlimited users only")
    }

    const stats = await getUserDetailedStats(daysBack)
    if (!stats || stats.length === 0) {
      throw new Error("No statistics data available for export")
    }

    // Convert to CSV format
    const headers = [
      "Date",
      "Cards Reviewed", 
      "Correct Answers",
      "Total Questions",
      "Accuracy Rate",
      "Time Spent (min)",
      "Topics Covered",
      "Weak Topics",
      "Learning Streak"
    ]

    const csvRows = [
      headers.join(","),
      ...stats.map(stat => [
        stat.date,
        stat.flashcards_reviewed,
        stat.correct_answers,
        stat.total_questions,
        stat.accuracy_rate,
        stat.time_spent_minutes,
        `"${(stat.topics_covered as string[]).join(", ")}"`,
        `"${(stat.weak_topics as string[]).join(", ")}"`,
        stat.learning_streak
      ].join(","))
    ]

    return csvRows.join("\n")
  } catch (error) {
    console.error("Failed to export CSV:", error)
    return null
  }
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = "flashcard-statistics.csv") {
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Example usage in a practice component:
 * 
 * ```typescript
 * import { recordPracticeSession } from "@/lib/statistics"
 * 
 * // After user completes a practice session
 * const sessionData = {
 *   flashcardCount: 5,
 *   correctCount: 4,
 *   timeMinutes: 12,
 *   topics: ["food", "family"]
 * }
 * 
 * const success = await recordPracticeSession(sessionData)
 * if (success) {
 *   toast.success("Progress recorded!")
 * }
 * ```
 */ 