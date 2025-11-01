'use client'

import { useState, useCallback, useEffect } from 'react'
import type { FlashcardData } from '../types/flashcard.types'
import { flashcardAPI } from '../services/flashcardService'

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
 * Mimics React Query interface for compatibility
 */
export function useRandomFlashcards(params: UseRandomFlashcardsParams = {}): UseRandomFlashcardsReturn {
  const { count = 20, commonWordsOnly = false } = params
  const [data, setData] = useState<FlashcardData[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchFlashcards = useCallback(async (throwOnError = false) => {
    setIsFetching(true)
    setError(null)
    
    try {
      const result = await flashcardAPI.getRandomFlashcards({ count, commonWordsOnly })
      setData(result)
      setIsLoading(false)
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
    return await fetchFlashcards(options?.throwOnError)
  }, [fetchFlashcards])

  return {
    data,
    isLoading,
    isFetching,
    refetch,
    error,
  }
}

