/**
 * Hook to fetch random flashcards (React Native version)
 * With AsyncStorage caching for daily flashcards
 */

import { useState, useCallback, useEffect } from 'react'
import type { FlashcardData } from '../types/flashcard.types'
import { flashcardAPI } from '../services/flashcardService'
import { loadDailyFlashcards, saveDailyFlashcards } from '../utils/daily-cache'

interface UseRandomFlashcardsParams {
  count?: number
  commonWordsOnly?: boolean
}

interface UseRandomFlashcardsReturn {
  data: FlashcardData[] | undefined
  isLoading: boolean
  isFetching: boolean
  refetch: (options?: { throwOnError?: boolean }) => Promise<{ data: FlashcardData[] | undefined }>
  error: Error | null
}

/**
 * Hook to fetch random flashcards
 * Checks daily cache first, then fetches from API if needed
 * Automatically caches fetched flashcards for the day
 */
export function useRandomFlashcards(params: UseRandomFlashcardsParams = {}): UseRandomFlashcardsReturn {
  const { count = 20, commonWordsOnly = false } = params
  const [data, setData] = useState<FlashcardData[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchFlashcards = useCallback(async (throwOnError = false, skipCache = false) => {
    setIsFetching(true)
    setError(null)

    try {
      // Check cache first (unless skipCache is true for manual refetch)
      if (!skipCache) {
        const cached = await loadDailyFlashcards()
        if (cached && cached.length >= count) {
          console.log(`📚 Using ${cached.length} cached flashcards`)
          const sliced = cached.slice(0, count)
          setData(sliced)
          setIsLoading(false)
          setIsFetching(false)
          return { data: sliced }
        }
      }

      // Fetch from API
      console.log(`🌐 Fetching ${count} flashcards from API`)
      const result = await flashcardAPI.getRandomFlashcards({ count, commonWordsOnly })
      setData(result)
      setIsLoading(false)

      // Save to cache for next time
      await saveDailyFlashcards(result)

      return { data: result }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch random flashcards')
      setError(error)
      setIsLoading(false)

      if (throwOnError) {
        throw error
      }

      return { data: undefined }
    } finally {
      setIsFetching(false)
    }
  }, [count, commonWordsOnly])

  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  const refetch = useCallback(async (options?: { throwOnError?: boolean }) => {
    // Skip cache on manual refetch
    return await fetchFlashcards(options?.throwOnError, true)
  }, [fetchFlashcards])

  return {
    data,
    isLoading,
    isFetching,
    refetch,
    error,
  }
}
