/**
 * Daily flashcard caching utilities
 * Provides localStorage-based caching for daily flashcards with timezone-aware expiry
 */

import type { FlashcardData } from '../types/flashcard.types'

const FLASHCARDS_CACHE_KEY = "flashcards:review"

interface CachedFlashcards {
  flashcards: FlashcardData[]
  date: string
  expiry: number
  timezone: string
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get today's date in YYYY-MM-DD format for user's timezone
 */
export function getTodayDateString(timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return formatter.format(now)
}

/**
 * Get end of day timestamp (11:59:59 PM) in user's timezone
 */
export function getEndOfDayTimestamp(timezone: string): number {
  const now = new Date()
  const todayString = getTodayDateString(timezone)

  const endOfDay = new Date(`${todayString}T23:59:59.999`)

  const userDate = new Date(
    endOfDay.toLocaleString("en-US", { timeZone: timezone })
  )
  const utcDate = new Date(
    endOfDay.toLocaleString("en-US", { timeZone: "UTC" })
  )
  const offset = utcDate.getTime() - userDate.getTime()

  return endOfDay.getTime() + offset
}

/**
 * Save flashcards to localStorage with expiry
 * Cache expires at end of day in user's timezone
 */
export function saveDailyFlashcards(flashcards: FlashcardData[]): void {
  const timezone = getUserTimezone()
  const today = getTodayDateString(timezone)
  const expiry = getEndOfDayTimestamp(timezone)

  const cacheData: CachedFlashcards = {
    flashcards,
    date: today,
    expiry,
    timezone,
  }

  try {
    localStorage.setItem(FLASHCARDS_CACHE_KEY, JSON.stringify(cacheData))
    console.log(
      `💾 Saved ${flashcards.length} flashcards to localStorage, expires at:`,
      new Date(expiry)
    )
  } catch (error) {
    console.error("Failed to save flashcards to localStorage:", error)
  }
}

/**
 * Load flashcards from localStorage if valid
 * Returns null if cache is expired or doesn't exist
 */
export function loadDailyFlashcards(): FlashcardData[] | null {
  try {
    const cached = localStorage.getItem(FLASHCARDS_CACHE_KEY)
    if (!cached) {
      console.log("📭 No cached flashcards found")
      return null
    }

    const cacheData: CachedFlashcards = JSON.parse(cached)
    const timezone = getUserTimezone()
    const today = getTodayDateString(timezone)
    const now = Date.now()

    if (cacheData.date === today && now < cacheData.expiry) {
      console.log(
        `📚 Loaded ${cacheData.flashcards.length} cached flashcards from ${cacheData.date}`
      )
      return cacheData.flashcards
    } else {
      console.log(
        `🗑️ Cache expired or from different day. Cached: ${cacheData.date}, Today: ${today}`
      )
      localStorage.removeItem(FLASHCARDS_CACHE_KEY)
      return null
    }
  } catch (error) {
    console.error("Failed to load flashcards from localStorage:", error)
    localStorage.removeItem(FLASHCARDS_CACHE_KEY)
    return null
  }
}

