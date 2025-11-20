/**
 * Daily flashcard caching utilities (React Native version)
 * Provides AsyncStorage-based caching for daily flashcards with timezone-aware expiry
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { FlashcardData } from '../types/flashcard.types'

const FLASHCARDS_CACHE_KEY = '@vio_vietnamese:flashcards:review'

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
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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
    endOfDay.toLocaleString('en-US', { timeZone: timezone })
  )
  const utcDate = new Date(
    endOfDay.toLocaleString('en-US', { timeZone: 'UTC' })
  )
  const offset = utcDate.getTime() - userDate.getTime()

  return endOfDay.getTime() + offset
}

/**
 * Save flashcards to AsyncStorage with expiry
 * Cache expires at end of day in user's timezone
 */
export async function saveDailyFlashcards(flashcards: FlashcardData[]): Promise<void> {
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
    await AsyncStorage.setItem(FLASHCARDS_CACHE_KEY, JSON.stringify(cacheData))
    console.log(
      `💾 Saved ${flashcards.length} flashcards to AsyncStorage, expires at:`,
      new Date(expiry)
    )
  } catch (error) {
    console.error('Failed to save flashcards to AsyncStorage:', error)
  }
}

/**
 * Load flashcards from AsyncStorage if valid
 * Returns null if cache is expired or doesn't exist
 */
export async function loadDailyFlashcards(): Promise<FlashcardData[] | null> {
  try {
    const cached = await AsyncStorage.getItem(FLASHCARDS_CACHE_KEY)
    if (!cached) {
      console.log('📭 No cached flashcards found')
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
      await AsyncStorage.removeItem(FLASHCARDS_CACHE_KEY)
      return null
    }
  } catch (error) {
    console.error('Failed to load flashcards from AsyncStorage:', error)
    await AsyncStorage.removeItem(FLASHCARDS_CACHE_KEY)
    return null
  }
}

/**
 * Clear daily flashcards cache
 */
export async function clearDailyFlashcardsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FLASHCARDS_CACHE_KEY)
    console.log('🗑️ Daily flashcards cache cleared')
  } catch (error) {
    console.error('Failed to clear daily flashcards cache:', error)
  }
}
