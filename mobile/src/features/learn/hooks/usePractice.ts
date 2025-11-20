/**
 * React Query hooks for Practice API (exercises and submission)
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '../config/queryClient'
import {
  getExerciseBySlugs,
  submitExerciseAttempt,
  canAccessExercise,
  createExerciseSession,
} from '../services'
import type { Exercise, SubmitExerciseParams, SubmitExerciseResponse } from '../types'
import {
  getCachedData,
  setCachedData,
  CACHE_TTL,
  getExerciseCacheKey,
  invalidateUserProgressCache,
} from '../utils/apiCache'
import { getCurrentUser } from '@/lib/supabase/client'

/**
 * Hook to fetch exercise by slugs
 */
export function useExercise(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<Exercise | null, Error> {
  return useQuery({
    queryKey: queryKeys.exercises.bySlugs(topicSlug, lessonSlug),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getExerciseCacheKey(topicSlug, lessonSlug)
      const cached = getCachedData<Exercise | null>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const exercise = await getExerciseBySlugs(topicSlug, lessonSlug)

      // Cache it
      setCachedData(cacheKey, exercise, CACHE_TTL.EXERCISES)

      return exercise
    },
    enabled: !!topicSlug && !!lessonSlug,
    staleTime: CACHE_TTL.EXERCISES,
  })
}

/**
 * Hook to check if user can access exercise
 */
export function useCanAccessExercise(
  practiceSetId: string
): UseQueryResult<boolean, Error> {
  return useQuery({
    queryKey: ['can-access-exercise', practiceSetId],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return false

      return await canAccessExercise(practiceSetId, user.id)
    },
    enabled: !!practiceSetId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to submit exercise attempt
 * Invalidates progress queries on success
 */
export function useSubmitExercise(): UseMutationResult<
  SubmitExerciseResponse,
  Error,
  SubmitExerciseParams,
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.submitExercise,
    mutationFn: async (params: SubmitExerciseParams) => {
      return await submitExerciseAttempt(params)
    },
    onSuccess: async (data, variables) => {
      // Get current user
      const user = await getCurrentUser()
      if (!user) return

      // Invalidate all progress queries for this user
      await queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all,
      })

      // Invalidate completion queries
      await queryClient.invalidateQueries({
        queryKey: ['completion'],
      })

      // Clear progress cache
      invalidateUserProgressCache(user.id)

      console.log('[useSubmitExercise] Exercise submitted successfully:', {
        success: data.success,
        coinsEarned: data.coinsEarned,
        xpEarned: data.xpEarned,
        isFirstPass: data.isFirstPass,
      })
    },
    onError: (error) => {
      console.error('[useSubmitExercise] Failed to submit exercise:', error)
    },
  })
}

/**
 * Hook to create exercise session
 */
export function useCreateExerciseSession(): UseMutationResult<
  boolean,
  Error,
  string,
  unknown
> {
  return useMutation({
    mutationKey: mutationKeys.createSession,
    mutationFn: async (practiceSetId: string) => {
      return await createExerciseSession(practiceSetId)
    },
    onSuccess: (success, practiceSetId) => {
      if (success) {
        console.log('[useCreateExerciseSession] Session created:', practiceSetId)
      } else {
        console.error('[useCreateExerciseSession] Failed to create session')
      }
    },
    onError: (error) => {
      console.error('[useCreateExerciseSession] Error creating session:', error)
    },
  })
}
