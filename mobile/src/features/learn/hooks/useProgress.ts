/**
 * React Query hooks for Progress API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getCurrentUser } from '@/lib/supabase/client'
import { queryKeys } from '../config/queryClient'
import {
  getUserLessonProgress,
  getUserTopicProgress,
  getUserZoneProgress,
  getZoneCompletionStats,
  getTopicProgressSummary,
  getZoneProgressSummary,
  getAllZonesProgressSummary,
  getCompletedTopicsInPreviousZone,
} from '../services'
import type {
  UserLessonProgress,
  ZoneCompletionStats,
  TopicProgressSummary,
  ZoneProgressSummary,
} from '../types'
import {
  getCachedData,
  setCachedData,
  CACHE_TTL,
  getUserProgressCacheKey,
  getTopicProgressCacheKey,
  getZoneProgressCacheKey,
  getZoneCompletionCacheKey,
} from '../utils/apiCache'

/**
 * Hook to fetch user progress for a lesson
 */
export function useUserLessonProgress(
  lessonId: number
): UseQueryResult<UserLessonProgress | null, Error> {
  return useQuery({
    queryKey: queryKeys.progress.lesson('current', lessonId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return null

      // Check cache first
      const cacheKey = getUserProgressCacheKey(user.id, lessonId)
      const cached = getCachedData<UserLessonProgress | null>(cacheKey)
      if (cached !== null) return cached

      // Fetch fresh data
      const progress = await getUserLessonProgress(user.id, lessonId)

      // Cache it
      setCachedData(cacheKey, progress, CACHE_TTL.PROGRESS)

      return progress
    },
    enabled: !!lessonId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch user progress for a topic (all lessons)
 */
export function useUserTopicProgress(
  topicId: number
): UseQueryResult<UserLessonProgress[], Error> {
  return useQuery({
    queryKey: queryKeys.progress.topic('current', topicId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return []

      // Check cache first
      const cacheKey = getTopicProgressCacheKey(user.id, topicId)
      const cached = getCachedData<UserLessonProgress[]>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const progress = await getUserTopicProgress(user.id, topicId)

      // Cache it
      setCachedData(cacheKey, progress, CACHE_TTL.PROGRESS)

      return progress
    },
    enabled: !!topicId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch user progress for a zone (all topics)
 */
export function useUserZoneProgress(
  zoneId: number
): UseQueryResult<UserLessonProgress[], Error> {
  return useQuery({
    queryKey: queryKeys.progress.zone('current', zoneId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return []

      // Check cache first
      const cacheKey = getZoneProgressCacheKey(user.id, zoneId)
      const cached = getCachedData<UserLessonProgress[]>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const progress = await getUserZoneProgress(user.id, zoneId)

      // Cache it
      setCachedData(cacheKey, progress, CACHE_TTL.PROGRESS)

      return progress
    },
    enabled: !!zoneId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch zone completion statistics
 */
export function useZoneCompletionStats(
  zoneId: number
): UseQueryResult<ZoneCompletionStats, Error> {
  return useQuery({
    queryKey: queryKeys.completion.zone('current', zoneId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return { completed: 0, total: 0 }

      // Check cache first
      const cacheKey = getZoneCompletionCacheKey(user.id, zoneId)
      const cached = getCachedData<ZoneCompletionStats>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const stats = await getZoneCompletionStats({ userId: user.id, zoneId })

      // Cache it
      setCachedData(cacheKey, stats, CACHE_TTL.PROGRESS)

      return stats
    },
    enabled: !!zoneId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch topic progress summary
 */
export function useTopicProgressSummary(
  topicId: number
): UseQueryResult<TopicProgressSummary | null, Error> {
  return useQuery({
    queryKey: queryKeys.completion.topicSummary('current', topicId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return null

      return await getTopicProgressSummary(user.id, topicId)
    },
    enabled: !!topicId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch zone progress summary
 */
export function useZoneProgressSummary(
  zoneId: number
): UseQueryResult<ZoneProgressSummary | null, Error> {
  return useQuery({
    queryKey: queryKeys.completion.zoneSummary('current', zoneId),
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return null

      return await getZoneProgressSummary(user.id, zoneId)
    },
    enabled: !!zoneId,
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch all zones progress summary
 */
export function useAllZonesProgressSummary(): UseQueryResult<ZoneProgressSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.progress.allZones('current'),
    queryFn: async () => {
      return await getAllZonesProgressSummary()
    },
    staleTime: CACHE_TTL.PROGRESS,
  })
}

/**
 * Hook to fetch completed topics in previous zone (for unlock logic)
 */
export function useCompletedTopicsInPreviousZone(
  currentZoneLevel: number
): UseQueryResult<{ completed: number; total: number }, Error> {
  return useQuery({
    queryKey: ['completion', 'previous-zone', currentZoneLevel],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) return { completed: 0, total: 0 }

      return await getCompletedTopicsInPreviousZone(user.id, currentZoneLevel)
    },
    enabled: currentZoneLevel > 1, // Only run for zones beyond Beginner
    staleTime: CACHE_TTL.PROGRESS,
  })
}
